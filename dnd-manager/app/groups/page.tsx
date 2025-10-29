import { createClient } from "@/lib/supabase/server";
import { GroupsIndex, type GroupRecord } from "@/components/ui/groups-index";
import { mapEntitiesToMentionTargets, mergeMentionTargets } from "@/lib/mention-utils";

export const runtime = 'edge'
export const revalidate = 300
export const fetchCache = 'force-cache'

export default async function GroupsPage() {
  const supabase = await createClient();

  const [groupsResult, charactersResult, sessionsResult, campaignsResult] = await Promise.all([
    supabase
      .from("groups")
      .select(`
        id, name, description, logo_url, created_at,
        group_characters (
          role,
          character:characters (id, name, player_type, status, image_url)
        ),
        group_sessions (
          session:sessions (
            id,
            name,
            session_date,
            created_at,
            campaign:campaigns (id, name)
          )
        ),
        group_campaigns (
          campaign:campaigns (id, name)
        )
      `)
      .order("name", { ascending: true }),
    supabase.from("characters").select("id, name").order("name", { ascending: true }),
    supabase.from("sessions").select("id, name").order("name", { ascending: true }),
    supabase.from("campaigns").select("id, name").order("name", { ascending: true }),
  ]);

  if (groupsResult.error) {
    throw new Error(groupsResult.error.message);
  }
  if (charactersResult.error) {
    throw new Error(charactersResult.error.message);
  }
  if (sessionsResult.error) {
    throw new Error(sessionsResult.error.message);
  }
  if (campaignsResult.error) {
    throw new Error(campaignsResult.error.message);
  }

  const groups = (groupsResult.data ?? []).map((groupEntry): GroupRecord => {
    const groupCharacters = Array.isArray(groupEntry?.group_characters)
      ? groupEntry.group_characters
          .map((membership) => {
            const rawCharacter = Array.isArray(membership?.character)
              ? membership.character[0]
              : membership?.character;
            if (
              !rawCharacter?.id ||
              !rawCharacter?.name ||
              !rawCharacter?.player_type ||
              !rawCharacter?.status
            ) {
              return null;
            }
            return {
              role: typeof membership?.role === "string" ? membership.role : "npc",
              character: {
                id: String(rawCharacter.id),
                name: String(rawCharacter.name),
                player_type: String(rawCharacter.player_type),
                status: String(rawCharacter.status),
                image_url: rawCharacter.image_url ?? null,
              },
            };
          })
          .filter((entry): entry is NonNullable<GroupRecord["group_characters"]>[number] => entry !== null)
      : [];

    const groupSessions = Array.isArray(groupEntry?.group_sessions)
      ? groupEntry.group_sessions
          .map((membership) => {
            const rawSession = Array.isArray(membership?.session)
              ? membership.session[0]
              : membership?.session;
            if (!rawSession?.id || !rawSession?.name) {
              return null;
            }
            const rawCampaign = Array.isArray(rawSession?.campaign)
              ? rawSession.campaign[0]
              : rawSession?.campaign;
            return {
              session: {
                id: String(rawSession.id),
                name: String(rawSession.name),
                session_date: rawSession.session_date ? String(rawSession.session_date) : null,
                created_at: String(rawSession.created_at),
                campaign: rawCampaign?.id && rawCampaign?.name
                  ? {
                      id: String(rawCampaign.id),
                      name: String(rawCampaign.name),
                    }
                  : null,
              },
            };
          })
          .filter((entry): entry is NonNullable<GroupRecord["group_sessions"]>[number] => entry !== null)
      : [];

    const groupCampaigns = Array.isArray(groupEntry?.group_campaigns)
      ? groupEntry.group_campaigns
          .map((membership) => {
            const rawCampaign = Array.isArray(membership?.campaign)
              ? membership.campaign[0]
              : membership?.campaign;
            if (!rawCampaign?.id || !rawCampaign?.name) {
              return null;
            }
            return {
              campaign: {
                id: String(rawCampaign.id),
                name: String(rawCampaign.name),
              },
            };
          })
          .filter((entry): entry is NonNullable<GroupRecord["group_campaigns"]>[number] => entry !== null)
      : [];

    return {
      id: String(groupEntry.id),
      name: String(groupEntry.name),
      description:
        typeof groupEntry.description === "string" ? groupEntry.description : null,
      logo_url: groupEntry.logo_url ? String(groupEntry.logo_url) : null,
      created_at: String(groupEntry.created_at),
      group_characters: groupCharacters,
      group_sessions: groupSessions,
      group_campaigns: groupCampaigns,
    };
  });
  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(groups, "group", (group) => `/groups/${group.id}`),
    mapEntitiesToMentionTargets(charactersResult.data, "character", (character) => `/characters/${character.id}`),
    mapEntitiesToMentionTargets(sessionsResult.data, "session", (session) => `/sessions/${session.id}`),
    mapEntitiesToMentionTargets(campaignsResult.data, "campaign", (campaign) => `/campaigns/${campaign.id}`),
  );

  return <GroupsIndex groups={groups} mentionTargets={mentionTargets} />;
}
