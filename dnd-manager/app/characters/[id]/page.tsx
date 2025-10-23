import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'
import { Suspense } from 'react'
import CharacterDetail from '@/components/characters/character-detail'

async function CharacterContent({ characterId }: { characterId: string }) {
  const supabase = await createClient()

  const [characterResult, campaignCharactersResult, organizationCharactersResult, sessionCharactersResult, campaignsResult, organizationsResult, sessionsResult] = await Promise.all([
    supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single(),
    supabase
      .from('campaign_characters')
      .select(`
        campaign:campaigns(
          id,
          name,
          description
        )
      `)
      .eq('character_id', characterId),
    supabase
      .from('organization_characters')
      .select(`
        organization:organizations(
          id,
          name,
          description
        )
      `)
      .eq('character_id', characterId),
    supabase
      .from('session_characters')
      .select(`
        session:sessions(
          id,
          name,
          session_date,
          created_at,
          summary
        )
      `)
      .eq('character_id', characterId)
      .order('session_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
    supabase
      .from('sessions')
      .select('id, name, session_date, created_at')
      .order('session_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ])

  if (characterResult.error) {
    throw new Error(characterResult.error.message)
  }

  const character = characterResult.data
  if (!character) {
    notFound();
  }

  const isMissingCampaignCharactersTable = (
    error: { message?: string | null; code?: string | null } | null | undefined
  ) => {
    if (!error) {
      return false
    }
    const code = error.code?.toUpperCase()
    if (code === '42P01') {
      return true
    }
    const message = error.message?.toLowerCase() ?? ''
    return message.includes('campaign_characters')
  }

  const isMissingSessionCharactersTable = (
    error: { message?: string | null; code?: string | null } | null | undefined
  ) => {
    if (!error) {
      return false
    }
    const code = error.code?.toUpperCase()
    if (code === '42P01') {
      return true
    }
    const message = error.message?.toLowerCase() ?? ''
    return message.includes('session_characters')
  }

  if (campaignCharactersResult?.error && !isMissingCampaignCharactersTable(campaignCharactersResult.error)) {
    throw new Error(campaignCharactersResult.error.message)
  }

  if (organizationCharactersResult?.error) {
    throw new Error(organizationCharactersResult.error.message)
  }

  if (sessionCharactersResult?.error && !isMissingSessionCharactersTable(sessionCharactersResult.error)) {
    throw new Error(sessionCharactersResult.error.message)
  }

  // Process campaigns
  const campaigns = isMissingCampaignCharactersTable(campaignCharactersResult?.error)
    ? []
    : campaignCharactersResult?.data
        ?.map(row => {
          const campaign = Array.isArray(row.campaign) ? row.campaign[0] : row.campaign
          if (!campaign?.id || !campaign.name) {
            return null
          }
          return {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description ?? null,
          }
        })
        .filter((campaign): campaign is NonNullable<typeof campaign> => campaign !== null)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) ?? []

  // Process organizations
  const organizations = organizationCharactersResult?.data
    ?.map(row => {
      const organization = Array.isArray(row.organization) ? row.organization[0] : row.organization
      if (!organization?.id || !organization.name) {
        return null
      }
      return {
        id: organization.id,
        name: organization.name,
        description: organization.description ?? null,
      }
    })
    .filter((organization): organization is NonNullable<typeof organization> => organization !== null)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) ?? []

  // Process sessions
  const sessions = isMissingSessionCharactersTable(sessionCharactersResult?.error)
    ? []
    : sessionCharactersResult?.data
        ?.map(row => {
          const session = Array.isArray(row.session) ? row.session[0] : row.session
          if (!session?.id || !session.name) {
            return null
          }
          return {
            id: session.id,
            name: session.name,
            session_date: session.session_date,
            created_at: session.created_at,
            summary: session.summary ?? null,
          }
        })
        .filter((session): session is NonNullable<typeof session> => session !== null)
        .sort((a, b) => {
          const aTimestamp = a.session_date ? new Date(a.session_date).getTime() : 
                            a.created_at ? new Date(a.created_at).getTime() : 0
          const bTimestamp = b.session_date ? new Date(b.session_date).getTime() : 
                            b.created_at ? new Date(b.created_at).getTime() : 0
          return bTimestamp - aTimestamp
        }) ?? []

  // Create mention targets
  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(campaignsResult.data ?? [], 'campaign', (campaign) => `/campaigns/${campaign.id}`),
    mapEntitiesToMentionTargets(organizationsResult.data ?? [], 'organization', (organization) => `/organizations/${organization.id}`),
    mapEntitiesToMentionTargets(sessionsResult.data ?? [], 'session', (session) => `/sessions/${session.id}`),
    mapEntitiesToMentionTargets([character], 'character', (entry) => `/characters/${entry.id}`)
  );

  return (
    <CharacterDetail
      character={character}
      campaigns={campaigns}
      organizations={organizations}
      sessions={sessions}
      mentionTargets={mentionTargets}
    />
  );
}

// Loading skeleton component
function CharacterLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="h-96 bg-gray-700 rounded animate-pulse"></div>
    </div>
  );
}

export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<CharacterLoading />}>
      <CharacterContent characterId={id} />
    </Suspense>
  );
}