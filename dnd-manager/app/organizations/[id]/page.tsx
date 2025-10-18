import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteOrganizationButton } from "@/components/ui/delete-organization-button";
import { deleteOrganization } from "@/lib/actions/organizations";
import { createClient } from "@/lib/supabase/server";

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
  campaign_id: string | null;
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
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, description, logo_url, created_at")
    .eq("id", params.id)
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
      .select("session:sessions (id, name, session_date, campaign_id)")
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

  type SessionRow = { session: SessionSummary | null };
  const sessions = ((sessionData ?? []) as unknown as SessionRow[])
    .flatMap((row) => (row.session ? [row.session] : []))
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
    await deleteOrganization(params.id);
  }

  return (
    <section className="space-y-10">
      <div>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#00ffff] transition-colors hover:text-[#ff00ff]"
        >
          <span aria-hidden>⟵</span>
          Back to Organizations
        </Link>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 flex-col gap-6 rounded border border-[#00ffff]/20 bg-[#0f0f23] p-6 shadow-[0_0_25px_rgba(0,255,255,0.08)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex-shrink-0">
              {organization.logo_url ? (
                <div className="relative h-32 w-32 overflow-hidden rounded border border-[#00ffff]/30 bg-[#050517]">
                  <Image
                    src={organization.logo_url}
                    alt={`${organization.name} logo`}
                    fill
                    sizes="128px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded border border-[#00ffff]/30 bg-[#050517] text-4xl text-[#00ffff]">
                  🏛
                </div>
              )}
            </div>

            <div className="flex-1 space-y-6">
              <header>
                <h1 className="text-3xl font-extrabold uppercase tracking-[0.35em] text-[#00ffff]">
                  {organization.name}
                </h1>
                <p className="mt-2 text-xs uppercase tracking-[0.35em] text-[#64748b]">
                  Established {new Date(organization.created_at).toLocaleDateString()}
                </p>
              </header>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#ff00ff]">
                  Overview
                </h2>
                {organization.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-[#cbd5f5]">
                    {organization.description}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-[#64748b]">
                    No description available for this organization yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 md:flex-col">
          <Link
            href={`/organizations/${organization.id}/edit`}
            className="inline-flex items-center justify-center rounded border border-[#00ffff]/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-[#00ffff] transition hover:border-[#ff00ff] hover:text-[#ff00ff]"
          >
            Edit Organization
          </Link>
          <form action={handleDelete}>
            <DeleteOrganizationButton />
          </form>
        </div>
      </div>

      <div className="grid gap-8">
        <section className="space-y-4 rounded border border-[#00ffff]/15 bg-[#0f0f23] p-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold uppercase tracking-[0.35em] text-[#00ffff]">Campaigns</h2>
              <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">
                Linked adventures run under this banner.
              </p>
            </div>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center justify-center rounded border border-[#00ffff]/40 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.35em] text-[#00ffff] transition hover:border-[#ff00ff] hover:text-[#ff00ff]"
            >
              New Campaign
            </Link>
          </header>

          {campaigns.length === 0 ? (
            <p className="rounded border border-dashed border-[#00ffff]/20 bg-[#050517] p-4 text-sm text-[#64748b]">
              No campaigns are linked to this organization yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="rounded border border-[#00ffff]/15 bg-[#050517] p-4">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.3em] text-[#00ffff] transition hover:text-[#ff00ff]"
                  >
                    <span>{campaign.name}</span>
                    <span className="text-xs text-[#64748b]">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded border border-[#00ffff]/15 bg-[#0f0f23] p-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold uppercase tracking-[0.35em] text-[#00ffff]">Sessions</h2>
              <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">
                Recent sessions affiliated with this group.
              </p>
            </div>
            <Link
              href="/sessions/new"
              className="inline-flex items-center justify-center rounded border border-[#00ffff]/40 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.35em] text-[#00ffff] transition hover:border-[#ff00ff] hover:text-[#ff00ff]"
            >
              Log Session
            </Link>
          </header>

          {sessions.length === 0 ? (
            <p className="rounded border border-dashed border-[#00ffff]/20 bg-[#050517] p-4 text-sm text-[#64748b]">
              No sessions are linked to this organization yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((session) => (
                <li key={session.id} className="rounded border border-[#00ffff]/15 bg-[#050517] p-4">
                  <Link
                    href={`/sessions/${session.id}`}
                    className="flex items-center justify-between text-sm font-semibold uppercase tracking-[0.3em] text-[#00ffff] transition hover:text-[#ff00ff]"
                  >
                    <span>{session.name}</span>
                    <span className="text-xs text-[#64748b]">
                      {session.session_date
                        ? new Date(session.session_date).toLocaleDateString()
                        : "Date TBD"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded border border-[#00ffff]/15 bg-[#0f0f23] p-6">
          <header>
            <h2 className="text-xl font-semibold uppercase tracking-[0.35em] text-[#00ffff]">Characters</h2>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[#64748b]">
              Characters appear with their role inside this organization.
            </p>
          </header>

          {characters.length === 0 ? (
            <p className="rounded border border-dashed border-[#00ffff]/20 bg-[#050517] p-4 text-sm text-[#64748b]">
              No characters are affiliated with this organization yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {characters.map((character) => (
                <li
                  key={character.id}
                  className="flex items-center gap-4 rounded border border-[#00ffff]/15 bg-[#050517] p-4"
                >
                  {character.image_url ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded border border-[#00ffff]/30">
                      <Image
                        src={character.image_url}
                        alt={character.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded border border-[#00ffff]/30 text-lg text-[#00ffff]">
                      ♞
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      href={`/characters/${character.id}`}
                      className="text-sm font-semibold uppercase tracking-[0.3em] text-[#00ffff] transition hover:text-[#ff00ff]"
                    >
                      {character.name}
                    </Link>
                    <div className="text-xs uppercase tracking-[0.3em] text-[#64748b]">
                      {character.player_type} · {character.status}
                    </div>
                  </div>
                  <span
                    className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] ${
                      character.role === "player"
                        ? "bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/40"
                        : "bg-[#ff00ff]/10 text-[#ff00ff] border border-[#ff00ff]/40"
                    }`}
                  >
                    {character.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
