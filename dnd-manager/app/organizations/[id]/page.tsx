import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteOrganizationButton } from "@/components/ui/delete-organization-button";
import EditIcon from "@/components/ui/edit-icon";
import { deleteOrganization } from "@/lib/actions/organizations";
import { createClient } from "@/lib/supabase/server";
import { formatDateStringForDisplay, formatTimestampForDisplay, getPillClasses, cn } from "@/lib/utils";
import { mapEntitiesToMentionTargets, mergeMentionTargets, renderNotesWithMentions, type MentionTarget } from "@/lib/mention-utils";

interface OrganizationRecord {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
}

interface CampaignSummary {
  id: string;
  name: string;
  created_at: string;
}

interface SessionSummary {
  id: string;
  name: string;
  session_date: string | null;
  created_at: string;
  campaign: { id: string; name: string } | null;
  session_number?: number;
}

type CharacterRole = "npc" | "player";

interface CharacterSummary {
  id: string;
  name: string;
  player_type: string;
  status: string;
  image_url: string | null;
  role: CharacterRole;
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, description, logo_url, created_at")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      notFound();
    }
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const organization = data as OrganizationRecord;

  const [
    { data: campaignData, error: campaignError },
    { data: sessionData, error: sessionError },
    { data: characterData, error: characterError },
  ] = await Promise.all([
    supabase
      .from("organization_campaigns")
      .select("campaign:campaigns (id, name, created_at)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_sessions")
      .select(
        "session:sessions (id, name, session_date, created_at, campaign:campaigns (id, name))",
      )
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_characters")
      .select("role, character:characters (id, name, player_type, status, image_url)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false }),
  ]);

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (characterError) {
    throw new Error(characterError.message);
  }

  type CampaignRow = { campaign: CampaignSummary | null };
  const campaigns = ((campaignData ?? []) as unknown as CampaignRow[])
    .flatMap((row) => (row.campaign ? [row.campaign] : []))
    .sort((a, b) => a.name.localeCompare(b.name));

  type SessionRow = {
    session:
      | (Omit<SessionSummary, "campaign"> & {
          campaign: { id: string; name: string } | { id: string; name: string }[] | null;
        })
      | null;
  };
  const sessions = ((sessionData ?? []) as unknown as SessionRow[])
    .flatMap((row) => {
      if (!row.session) {
        return [];
      }

      const campaignValue = row.session.campaign;
      const normalizedCampaign = Array.isArray(campaignValue)
        ? campaignValue[0] ?? null
        : campaignValue ?? null;

      return [
        {
          id: row.session.id,
          name: row.session.name,
          session_date: row.session.session_date,
          created_at: row.session.created_at,
          campaign: normalizedCampaign,
        } satisfies SessionSummary,
      ];
    })
    .sort((a, b) => {
      const aDate = a.session_date ?? "";
      const bDate = b.session_date ?? "";
      return bDate.localeCompare(aDate);
    });

  // Calculate session numbers within each campaign
  const campaignSessionCounts = new Map<string, number>();
  const sessionsWithNumbers: SessionSummary[] = sessions.map((session) => {
    let sessionNumber: number | undefined;
    if (session.campaign) {
      const count = campaignSessionCounts.get(session.campaign.id) || 0;
      campaignSessionCounts.set(session.campaign.id, count + 1);
      sessionNumber = count + 1;
    }
    return {
      ...session,
      session_number: sessionNumber,
    };
  });

  type CharacterRow = {
    role: CharacterRole | null;
    character: (Omit<CharacterSummary, "role"> & { id: string }) | null;
  };

  const characters = ((characterData ?? []) as unknown as CharacterRow[]).flatMap((row) => {
    if (!row.character) {
      return [];
    }

    return [
      {
        ...row.character,
        role: (row.role ?? "npc") as CharacterRole,
      },
    ];
  });

  const mentionTargets: MentionTarget[] = mergeMentionTargets(
    mapEntitiesToMentionTargets(characters, "character", (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(sessions, "session", (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(campaigns, "campaign", (entry) => `/campaigns/${entry.id}`),
    mapEntitiesToMentionTargets([organization], "organization", (entry) => `/organizations/${entry.id}`)
  );

  async function handleDelete() {
    "use server";
    await deleteOrganization(id);
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl pt-4 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 space-y-6 sm:space-y-8">
        <div className="flex flex-row flex-wrap items-center gap-3 justify-between">
          <Link
            href="/organizations"
            className="text-[var(--cyber-cyan)] hover-cyber font-mono uppercase tracking-wider text-sm sm:text-base"
          >
            ← Back to Groups
          </Link>
          <div className="flex flex-row flex-wrap items-center gap-2 ml-auto">
            <Link
              href={`/organizations/${organization.id}/edit`}
              className="inline-flex self-start w-auto h-10 bg-[var(--cyber-magenta)] text-black px-4 text-sm sm:text-base rounded font-bold uppercase tracking-wider hover-brightness transition-all duration-200 shadow-lg shadow-[var(--cyber-magenta)]/50 text-center items-center justify-center"
            >
              <EditIcon size="sm" className="bg-black" />
            </Link>
            <form action={handleDelete}>
              <DeleteOrganizationButton />
            </form>
          </div>
        </div>
        
        <header className="-mt-4">
          <h1 className="retro-title text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-widest text-[var(--text-primary)] drop-shadow-[0_0_8px_rgba(0,255,255,0.35)] break-words">
            {organization.name}
          </h1>
        </header>

        <div className="space-y-6 md:space-y-0 md:flex md:flex-row-reverse md:items-stretch md:gap-8 -mt-2">
          {organization.logo_url && (
            <aside className="md:flex md:flex-col md:w-80 md:max-w-sm md:self-stretch w-full max-w-sm mx-auto md:mx-0 rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-[var(--bg-dark)] shadow-lg shadow-[var(--cyber-cyan)]/20 font-mono text-sm text-[var(--text-primary)]">
              <div className="p-4 flex h-full flex-col">
                <div className="space-y-3">
                  <div className="relative aspect-[5/6] overflow-hidden rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-black">
                    <Image
                      src={organization.logo_url}
                      alt={`${organization.name} logo`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 200px, 256px"
                    />
                  </div>
                  <p className="mt-2 px-4 text-center text-xs uppercase tracking-widest text-[var(--text-secondary)] break-words leading-tight">
                    {organization.name}
                  </p>
                </div>
                <div className="mt-auto" />
              </div>
            </aside>
          )}

          <section className="flex-1 space-y-3 text-[var(--text-primary)] font-mono leading-relaxed text-sm sm:text-base lg:text-lg">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider"
              style={{
                fontFamily: 'var(--font-press-start), monospace',
                WebkitFontSmoothing: 'none',
                fontSmoothing: 'never'
              } as React.CSSProperties}>Overview</h2>
            {organization.description && (
              <div className="whitespace-pre-wrap leading-relaxed break-words">
                {renderNotesWithMentions(organization.description, mentionTargets)}
              </div>
            )}
          </section>

        </div>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-press-start), monospace',
              WebkitFontSmoothing: 'none',
              fontSmoothing: 'never'
            } as React.CSSProperties}>Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="text-[var(--text-muted)] font-mono italic text-sm sm:text-base">No campaigns are linked to this group yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className={getPillClasses('campaign', 'small')}
                >
                  <span className="font-semibold">{campaign.name}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-press-start), monospace',
              WebkitFontSmoothing: 'none',
              fontSmoothing: 'never'
            } as React.CSSProperties}>Members</h2>
          {characters.length === 0 ? (
            <p className="text-[var(--text-muted)] font-mono italic text-sm sm:text-base">No characters are affiliated with this group yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {characters.map((character) => {
                const isPlayer = character.player_type === "player";
                const pillClasses = isPlayer
                  ? "border border-[var(--cyber-cyan)] border-opacity-40 bg-[var(--bg-dark)] text-[var(--cyber-cyan)] hover-cyber focus-visible:ring-[var(--cyber-cyan)]"
                  : "border border-[var(--cyber-magenta)] border-opacity-40 bg-[var(--cyber-magenta)]/10 text-[var(--cyber-magenta)] hover:text-[var(--cyber-cyan)] hover:border-[var(--cyber-cyan)]/70 hover:bg-[var(--cyber-cyan)]/10 focus-visible:ring-[var(--cyber-magenta)]";

                return (
                  <Link
                    key={character.id}
                    href={`/characters/${character.id}`}
                    className={cn(getPillClasses(
                      character.player_type === 'player' ? 'player' : 'npc',
                      'small'
                    ))}
                  >
                    {character.name}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider"
            style={{
              fontFamily: 'var(--font-press-start), monospace',
              WebkitFontSmoothing: 'none',
              fontSmoothing: 'never'
            } as React.CSSProperties}>Sessions</h2>
          {sessionsWithNumbers.length === 0 ? (
            <p className="text-[var(--text-muted)] font-mono italic text-sm sm:text-base">No sessions are linked to this group yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sessionsWithNumbers.map((session) => (
                <article
                  key={session.id}
                  className="group relative overflow-hidden rounded border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)]/40 p-3 sm:p-4 shadow-2xl transition-all duration-200 hover-cyber min-h-[80px]"
                >
                  <Link
                    href={`/sessions/${session.id}`}
                    className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
                    aria-label={`View session ${session.name}`}
                  >
                    <span aria-hidden="true" />
                  </Link>
                  <div className="relative z-10 flex flex-col h-full pointer-events-none">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <span className="font-medium text-[var(--cyber-cyan)] font-mono text-sm sm:text-base transition-colors hover-cyber break-words flex-1">
                        {session.name}
                      </span>
                      <span className={getPillClasses('date', 'tiny')}>
                        {formatDateStringForDisplay(session.session_date) ?? "Date TBD"}
                      </span>
                    </div>
                    <div className="mt-auto pt-2 flex items-center justify-between gap-2 flex-wrap">
                      {session.campaign?.name ? (
                        <Link
                          href={`/campaigns/${session.campaign.id}`}
                          className={cn(getPillClasses('campaign', 'tiny'), 'pointer-events-auto min-h-[24px]')}
                        >
                          {session.campaign.name}
                        </Link>
                      ) : (
                        <div />
                      )}
                      {session.session_number && (
                        <span className={cn(getPillClasses('session', 'tiny'), 'min-h-[24px]')}>
                          Session {session.session_number}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
