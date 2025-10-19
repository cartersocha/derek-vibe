import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteOrganizationButton } from "@/components/ui/delete-organization-button";
import { deleteOrganization } from "@/lib/actions/organizations";
import { createClient } from "@/lib/supabase/server";
import { formatDateStringForDisplay, formatTimestampForDisplay } from "@/lib/utils";

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
  campaign: { id: string; name: string } | null;
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
        "session:sessions (id, name, session_date, campaign:campaigns (id, name))",
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
          campaign: normalizedCampaign,
        } satisfies SessionSummary,
      ];
    })
    .sort((a, b) => {
      const aDate = a.session_date ?? "";
      const bDate = b.session_date ?? "";
      return bDate.localeCompare(aDate);
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

  async function handleDelete() {
    "use server";
    await deleteOrganization(id);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link
          href="/organizations"
          className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider"
        >
          ← Back to Groups
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={`/organizations/${organization.id}/edit`}
            className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            Edit Group
          </Link>
          <form action={handleDelete}>
            <DeleteOrganizationButton />
          </form>
        </div>
      </div>

      <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8 space-y-8">
        <header>
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest text-[#e8faff] drop-shadow-[0_0_8px_rgba(0,255,255,0.35)]">
            {organization.name}
          </h1>
        </header>

        <div className="space-y-6 md:space-y-0 md:flex md:flex-row-reverse md:items-stretch md:gap-8">
          <aside className="md:flex md:flex-col md:w-80 md:max-w-sm md:self-stretch w-full max-w-sm rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-lg shadow-[#00ffff]/20 font-mono text-sm text-gray-200">
            <div className="p-4 flex h-full flex-col">
              {organization.logo_url ? (
                <div className="space-y-3">
                  <div className="relative aspect-[5/6] overflow-hidden rounded border border-[#00ffff] border-opacity-30 bg-black">
                    <Image
                      src={organization.logo_url}
                      alt={`${organization.name} logo`}
                      fill
                      className="object-contain"
                      sizes="256px"
                    />
                  </div>
                  <p className="mt-2 px-4 text-center text-xs uppercase tracking-widest text-gray-400 break-words leading-tight">
                    {organization.name}
                  </p>
                </div>
              ) : null}
              <div className="mt-auto" />
            </div>
          </aside>

          <section className="flex-1 space-y-3 text-gray-300 font-mono leading-relaxed text-base sm:text-lg">
            <h2 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Overview</h2>
            {organization.description ? (
              <p className="whitespace-pre-wrap leading-relaxed">{organization.description}</p>
            ) : (
              <p className="text-gray-500 italic">No description available for this group yet.</p>
            )}
          </section>

        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="text-gray-500 font-mono italic">No campaigns are linked to this group yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {campaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  className="group relative overflow-hidden rounded border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/40 p-3 shadow-2xl transition-all duration-200 hover:border-[#ff00ff] hover:bg-[#0f0f23] hover:shadow-[#ff00ff]/40"
                >
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                    aria-label={`View campaign ${campaign.name}`}
                  >
                    <span aria-hidden="true" />
                  </Link>
                  <div className="relative z-10 pointer-events-none">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-[#00ffff] font-mono text-base transition-colors group-hover:text-[#ff00ff]">
                        {campaign.name}
                      </span>
                      <span className="rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-[#ff6ad5] border border-[#ff00ff]/40 bg-[#211027]">
                        {formatTimestampForDisplay(campaign.created_at) ?? 'Unknown'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 font-mono italic">No sessions are linked to this group yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.map((session) => (
                <article
                  key={session.id}
                  className="group relative overflow-hidden rounded border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/40 p-3 shadow-2xl transition-all duration-200 hover:border-[#ff00ff] hover:bg-[#0f0f23] hover:shadow-[#ff00ff]/40"
                >
                  <Link
                    href={`/sessions/${session.id}`}
                    className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                    aria-label={`View session ${session.name}`}
                  >
                    <span aria-hidden="true" />
                  </Link>
                  <div className="relative z-10 pointer-events-none">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-[#00ffff] font-mono text-base transition-colors group-hover:text-[#ff00ff]">
                        {session.name}
                      </span>
                      <span className="rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-[#00ffff] border border-[#00ffff]/40 bg-[#0f0f23]">
                        {formatDateStringForDisplay(session.session_date) ?? "Date TBD"}
                      </span>
                    </div>
                    {session.campaign?.name ? (
                      <Link
                        href={`/campaigns/${session.campaign.id}`}
                        className="pointer-events-auto mt-3 inline-flex items-center rounded border border-[#ff00ff]/40 bg-[#211027] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[#ff6ad5] transition-colors hover:border-[#ff6ad5] hover:text-[#ff9de6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6ad5]"
                      >
                        {session.campaign.name}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Characters</h2>
          {characters.length === 0 ? (
            <p className="text-gray-500 font-mono italic">No characters are affiliated with this group yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {characters.map((character) => {
                const isPlayer = character.role === "player";
                const badgeClasses = isPlayer
                  ? "border border-[#00ffff] border-opacity-40 bg-[#0f0f23] text-[#00ffff] group-hover:border-[#00ffff] group-hover:text-[#ff00ff]"
                  : "border border-[#ff00ff] border-opacity-40 bg-[#211027] text-[#ff6ad5] group-hover:border-[#ff6ad5] group-hover:text-[#ff9de6]";

                return (
                  <article
                    key={character.id}
                    className="group relative overflow-hidden rounded border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/40 p-3 shadow-2xl transition-all duration-200 hover:border-[#ff00ff] hover:bg-[#0f0f23] hover:shadow-[#ff00ff]/40"
                  >
                    <Link
                      href={`/characters/${character.id}`}
                      className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                      aria-label={`View character ${character.name}`}
                    >
                      <span aria-hidden="true" />
                    </Link>
                    <div className="relative z-10 pointer-events-none">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium text-[#00ffff] font-mono text-base transition-colors group-hover:text-[#ff00ff]">
                          {character.name}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${badgeClasses}`}>
                          {isPlayer ? "Player" : "NPC"}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-gray-400 font-mono uppercase tracking-widest">
                        {character.player_type} · {character.status}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
