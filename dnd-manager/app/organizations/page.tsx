import { createClient } from "@/lib/supabase/server";
import { OrganizationsIndex, type OrganizationRecord } from "@/components/ui/organizations-index";
import { mapEntitiesToMentionTargets, mergeMentionTargets } from "@/lib/mention-utils";

export const runtime = 'edge'
export const revalidate = 300
export const fetchCache = 'force-cache'

export default async function OrganizationsPage() {
  const supabase = await createClient();

  const [organizationsResult, charactersResult, sessionsResult, campaignsResult] = await Promise.all([
    supabase
      .from("organizations")
      .select(`
        id, name, description, logo_url, created_at,
        organization_characters (
          role,
          character:characters (id, name, player_type, status, image_url)
        ),
        organization_sessions (
          session:sessions (
            id,
            name,
            session_date,
            created_at,
            campaign:campaigns (id, name)
          )
        ),
        organization_campaigns (
          campaign:campaigns (id, name)
        )
      `)
      .order("name", { ascending: true }),
    supabase.from("characters").select("id, name").order("name", { ascending: true }),
    supabase.from("sessions").select("id, name").order("name", { ascending: true }),
    supabase.from("campaigns").select("id, name").order("name", { ascending: true }),
  ]);

  if (organizationsResult.error) {
    throw new Error(organizationsResult.error.message);
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

  const organizations = (organizationsResult.data ?? []).map((organizationEntry): OrganizationRecord => {
    const organizationCharacters = Array.isArray(organizationEntry?.organization_characters)
      ? organizationEntry.organization_characters
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
          .filter(
            (
              entry,
            ): entry is NonNullable<OrganizationRecord["organization_characters"]>[number] => entry !== null,
          )
      : [];

    const organizationSessions = Array.isArray(organizationEntry?.organization_sessions)
      ? organizationEntry.organization_sessions
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
          .filter(
            (
              entry,
            ): entry is NonNullable<OrganizationRecord["organization_sessions"]>[number] => entry !== null,
          )
      : [];

    const organizationCampaigns = Array.isArray(organizationEntry?.organization_campaigns)
      ? organizationEntry.organization_campaigns
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
          .filter(
            (
              entry,
            ): entry is NonNullable<OrganizationRecord["organization_campaigns"]>[number] => entry !== null,
          )
      : [];

    return {
      id: String(organizationEntry.id),
      name: String(organizationEntry.name),
      description:
        typeof organizationEntry.description === "string" ? organizationEntry.description : null,
      logo_url: organizationEntry.logo_url ? String(organizationEntry.logo_url) : null,
      created_at: String(organizationEntry.created_at),
      organization_characters: organizationCharacters,
      organization_sessions: organizationSessions,
      organization_campaigns: organizationCampaigns,
    };
  });
  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(organizations, "organization", (organization) => `/organizations/${organization.id}`),
    mapEntitiesToMentionTargets(charactersResult.data, "character", (character) => `/characters/${character.id}`),
    mapEntitiesToMentionTargets(sessionsResult.data, "session", (session) => `/sessions/${session.id}`),
    mapEntitiesToMentionTargets(campaignsResult.data, "campaign", (campaign) => `/campaigns/${campaign.id}`),
  );

  return <OrganizationsIndex organizations={organizations} mentionTargets={mentionTargets} />;
}
