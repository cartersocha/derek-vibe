import { GroupForm } from "@/components/groups/group-form";
import { createGroup } from "@/lib/actions/groups";
import { mapEntitiesToMentionTargets, mergeMentionTargets } from "@/lib/mention-utils";
import { createClient } from "@/lib/supabase/server";
import { formatDateStringForDisplay } from "@/lib/utils";

export default async function NewGroupPage() {
  const supabase = await createClient();

  const [campaignsResult, sessionsResult, charactersResult, groupsResult] = await Promise.all([
    supabase.from("campaigns").select("id, name, created_at").order("created_at", { ascending: false }),
    supabase
      .from("sessions")
      .select("id, name, session_date")
      .order("session_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("characters")
      .select("id, name, player_type, status")
      .order("name"),
    supabase.from("groups").select("id, name").order("name"),
  ]);

  const campaignOptions = (campaignsResult.data ?? []).map((campaign) => ({
    value: campaign.id,
    label: campaign.name ?? "Untitled Campaign",
  }));

  // Get the newest campaign as default
  const defaultCampaignIds = campaignsResult.data && campaignsResult.data.length > 0 
    ? [campaignsResult.data[0].id] 
    : [];

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

  // Create mention targets for @ mentions
  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersResult.data, "character", (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(groupsResult.data, "group", (entry) => `/groups/${entry.id}`),
    mapEntitiesToMentionTargets(campaignsResult.data, "campaign", (entry) => `/campaigns/${entry.id}`),
    mapEntitiesToMentionTargets(sessionsResult.data, "session", (entry) => `/sessions/${entry.id}`)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="retro-title text-xl sm:text-2xl font-bold text-[var(--cyber-cyan)] break-words">
          Create Group
        </h2>
      </div>

      <GroupForm
        action={createGroup}
        cancelHref="/groups"
        submitLabel="Save Group"
        campaignOptions={campaignOptions}
        sessionOptions={sessionOptions}
        characterOptions={characterOptions}
        defaultCampaignIds={defaultCampaignIds}
        mentionTargets={mentionTargets}
      />
    </div>
  );
}
