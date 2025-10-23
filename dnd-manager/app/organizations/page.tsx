import { createClient } from "@/lib/supabase/server";
import { OrganizationsIndex, type OrganizationRecord } from "@/components/ui/organizations-index";
import { mapEntitiesToMentionTargets, mergeMentionTargets } from "@/lib/mention-utils";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";

// Cache organizations data for 5 minutes
const getCachedOrganizations = unstable_cache(
  async () => {
    const supabase = await createClient();
    
    // Simplified query - remove nested relations for index view
    const { data: organizations } = await supabase
      .from("organizations")
      .select(`
        id,
        name,
        description,
        logo_url,
        created_at
      `)
      .order("name", { ascending: true });

    return organizations || [];
  },
  ['organizations-index'],
  { 
    revalidate: 300, // 5 minutes
    tags: ['organizations'] 
  }
);

// Cache mention targets separately for better performance
const getCachedMentionTargets = unstable_cache(
  async () => {
    const supabase = await createClient();
    
    const [charactersResult, sessionsResult, campaignsResult] = await Promise.all([
      supabase.from("characters").select("id, name").order("name", { ascending: true }),
      supabase.from("sessions").select("id, name").order("name", { ascending: true }),
      supabase.from("campaigns").select("id, name").order("name", { ascending: true }),
    ]);

    if (charactersResult.error) {
      throw new Error(charactersResult.error.message);
    }
    if (sessionsResult.error) {
      throw new Error(sessionsResult.error.message);
    }
    if (campaignsResult.error) {
      throw new Error(campaignsResult.error.message);
    }

    return mergeMentionTargets(
      mapEntitiesToMentionTargets(charactersResult.data, "character", (character) => `/characters/${character.id}`),
      mapEntitiesToMentionTargets(sessionsResult.data, "session", (session) => `/sessions/${session.id}`),
      mapEntitiesToMentionTargets(campaignsResult.data, "campaign", (campaign) => `/campaigns/${campaign.id}`),
    );
  },
  ['organizations-mention-targets'],
  { 
    revalidate: 600, // 10 minutes
    tags: ['mention-targets'] 
  }
);

// Cache organization details for the index view
const getCachedOrganizationDetails = unstable_cache(
  async (organizationIds: string[]) => {
    const supabase = await createClient();
    
    const { data: organizationDetails } = await supabase
      .from("organizations")
      .select(`
        id,
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
      .in("id", organizationIds);

    return organizationDetails || [];
  },
  ['organizations-details'],
  { 
    revalidate: 180, // 3 minutes
    tags: ['organization-details'] 
  }
);

async function OrganizationsList() {
  const [organizations, mentionTargets] = await Promise.all([
    getCachedOrganizations(),
    getCachedMentionTargets()
  ]);

  if (!organizations || organizations.length === 0) {
    return <OrganizationsIndex organizations={[]} mentionTargets={mentionTargets} />;
  }

  // Get organization details separately for better performance
  const organizationIds = organizations.map(org => org.id);
  const organizationDetails = await getCachedOrganizationDetails(organizationIds);

  // Merge basic organization data with details
  const enrichedOrganizations: OrganizationRecord[] = organizations.map((org) => {
    const details = organizationDetails.find(detail => detail.id === org.id);
    
    const organizationCharacters = Array.isArray(details?.organization_characters)
      ? details.organization_characters
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

    const organizationSessions = Array.isArray(details?.organization_sessions)
      ? details.organization_sessions
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

    const organizationCampaigns = Array.isArray(details?.organization_campaigns)
      ? details.organization_campaigns
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
      id: String(org.id),
      name: String(org.name),
      description:
        typeof org.description === "string" ? org.description : null,
      logo_url: org.logo_url ? String(org.logo_url) : null,
      created_at: String(org.created_at),
      organization_characters: organizationCharacters,
      organization_sessions: organizationSessions,
      organization_campaigns: organizationCampaigns,
    };
  });

  return <OrganizationsIndex organizations={enrichedOrganizations} mentionTargets={mentionTargets} />;
}

export default async function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#1a1a3e] rounded w-48 mb-4"></div>
            <div className="h-10 bg-[#1a1a3e] rounded w-full mb-6"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-[#1a1a3e] bg-opacity-50 rounded-lg p-6 h-64"></div>
            ))}
          </div>
        </div>
      }>
        <OrganizationsList />
      </Suspense>
    </div>
  );
}
