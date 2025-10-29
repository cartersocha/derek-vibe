import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupForm } from "@/components/groups/group-form";
import { updateGroup } from "@/lib/actions/groups";
import { mapEntitiesToMentionTargets, mergeMentionTargets } from "@/lib/mention-utils";
import { createClient } from "@/lib/supabase/server";
import { formatDateStringForDisplay } from "@/lib/utils";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, logo_url")
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

  const group = data;

  const [campaignsResult, sessionsResult, charactersResult, groupsResult, campaignLinksResult, sessionLinksResult, characterLinksResult] =
    await Promise.all([
      supabase.from("campaigns").select("id, name, created_at").order("created_at", { ascending: false }),
      supabase.from("sessions").select("id, name, session_date").order("session_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
      supabase.from("characters").select("id, name, player_type, status").order("name"),
      supabase.from("groups").select("id, name").order("name"),
      supabase.from("group_campaigns").select("campaign_id").eq("group_id", id),
      supabase.from("group_sessions").select("session_id").eq("group_id", id),
      supabase.from("group_characters").select("character_id").eq("group_id", id),
    ]);

  const campaignOptions = (campaignsResult.data ?? []).map((campaign) => ({
    value: campaign.id,
    label: campaign.name ?? "Untitled Campaign",
  }));

  const sessionOptions = (sessionsResult.data ?? []).map((session) => ({
    value: session.id,
    label: session.name ?? "Untitled Session",
    hint: formatDateStringForDisplay(session.session_date) ?? "Date TBD",
  }));

  const characterOptions = (charactersResult.data ?? []).map((character) => {
    const playerTypeLabel = character.player_type === "player" ? "Player" : "NPC";
    const statusLabel = character.status
      ? character.status.replace(/^[a-z]/, (match: string) => match.toUpperCase())
      : "Unknown";
    return {
      value: character.id,
      label: character.name ?? "Unnamed Character",
      hint: `${playerTypeLabel} · ${statusLabel}`,
    };
  });

  const defaultCampaignIds = (campaignLinksResult.data ?? []).map((entry) => entry.campaign_id).filter(Boolean);
  const defaultSessionIds = (sessionLinksResult.data ?? []).map((entry) => entry.session_id).filter(Boolean);
  const defaultCharacterIds = (characterLinksResult.data ?? []).map((entry) => entry.character_id).filter(Boolean);

  // Create mention targets for @ mentions
  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersResult.data, "character", (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(groupsResult.data, "group", (entry) => `/groups/${entry.id}`),
    mapEntitiesToMentionTargets(campaignsResult.data, "campaign", (entry) => `/campaigns/${entry.id}`),
    mapEntitiesToMentionTargets(sessionsResult.data, "session", (entry) => `/sessions/${entry.id}`)
  );


  async function handleUpdate(formData: FormData) {
    "use server";
    await updateGroup(id, formData);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/groups/${id}`}
          className="text-[var(--cyber-cyan)] hover:text-[var(--cyber-magenta)] font-mono uppercase tracking-wider"
        >
          ← Back to Group
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider break-words">Edit Group</h2>
      </div>

      <GroupForm
        action={handleUpdate}
        cancelHref={`/groups/${id}`}
        defaultValues={{ name: group.name, description: group.description }}
        logoUrl={group.logo_url}
        campaignOptions={campaignOptions}
        sessionOptions={sessionOptions}
        characterOptions={characterOptions}
        defaultCampaignIds={defaultCampaignIds}
        defaultSessionIds={defaultSessionIds}
        defaultCharacterIds={defaultCharacterIds}
        mentionTargets={mentionTargets}
        showLogoRemove
        submitLabel="Save Changes"
      />
    </div>
  );
}
