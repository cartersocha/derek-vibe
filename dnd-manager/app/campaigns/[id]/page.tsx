import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'
import { Suspense } from 'react'
import CampaignDetail from '@/components/campaigns/campaign-detail'

async function CampaignContent({ campaignId }: { campaignId: string }) {
  const supabase = await createClient()

  const [campaignResult, campaignCharactersResult, organizationCampaignsResult, sessionsResult, charactersResult, organizationsResult, sessionsResult2] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single(),
    supabase
      .from('campaign_characters')
      .select(`
        character:characters(
          id,
          name,
          player_type,
          location,
          status,
          level
        )
      `)
      .eq('campaign_id', campaignId),
    supabase
      .from('organization_campaigns')
      .select(`
        organization:organizations(
          id,
          name,
          description
        )
      `)
      .eq('campaign_id', campaignId),
    supabase
      .from('sessions')
      .select(`
        id,
        name,
        session_date,
        created_at,
        summary
      `)
      .eq('campaign_id', campaignId)
      .order('session_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
    supabase
      .from('sessions')
      .select('id, name, session_date, created_at')
      .order('session_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ])

  if (campaignResult.error) {
    throw new Error(campaignResult.error.message)
  }

  const campaign = campaignResult.data
  if (!campaign) {
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

  if (campaignCharactersResult?.error && !isMissingCampaignCharactersTable(campaignCharactersResult.error)) {
    throw new Error(campaignCharactersResult.error.message)
  }

  if (organizationCampaignsResult?.error) {
    throw new Error(organizationCampaignsResult.error.message)
  }

  if (sessionsResult?.error) {
    throw new Error(sessionsResult.error.message)
  }

  // Process characters
  const characters = isMissingCampaignCharactersTable(campaignCharactersResult?.error)
    ? []
    : campaignCharactersResult?.data
        ?.map(row => {
          const character = Array.isArray(row.character) ? row.character[0] : row.character
          if (!character?.id || !character.name) {
            return null
          }
          return {
            id: character.id,
            name: character.name,
            player_type: character.player_type ?? null,
            location: character.location ?? null,
            status: character.status ?? null,
            level: character.level ?? null,
          }
        })
        .filter((character): character is NonNullable<typeof character> => character !== null)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })) ?? []

  // Process organizations
  const organizations = organizationCampaignsResult?.data
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
  const sessions = sessionsResult?.data
    ?.map(session => ({
      id: session.id,
      name: session.name,
      session_date: session.session_date,
      created_at: session.created_at,
      summary: session.summary ?? null,
    }))
    .sort((a, b) => {
      const aTimestamp = a.session_date ? new Date(a.session_date).getTime() : 
                        a.created_at ? new Date(a.created_at).getTime() : 0
      const bTimestamp = b.session_date ? new Date(b.session_date).getTime() : 
                        b.created_at ? new Date(b.created_at).getTime() : 0
      return bTimestamp - aTimestamp
    }) ?? []

  // Create mention targets
  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersResult.data ?? [], 'character', (character) => `/characters/${character.id}`),
    mapEntitiesToMentionTargets(organizationsResult.data ?? [], 'organization', (organization) => `/organizations/${organization.id}`),
    mapEntitiesToMentionTargets(sessionsResult2.data ?? [], 'session', (session) => `/sessions/${session.id}`),
    mapEntitiesToMentionTargets([campaign], 'campaign', (entry) => `/campaigns/${entry.id}`)
  );

  return (
    <CampaignDetail
      campaign={campaign}
      characters={characters}
      organizations={organizations}
      sessions={sessions}
      mentionTargets={mentionTargets}
      isMissingCampaignCharactersTable={isMissingCampaignCharactersTable(campaignCharactersResult?.error)}
    />
  );
}

// Loading skeleton component
function CampaignLoading() {
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

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<CampaignLoading />}>
      <CampaignContent campaignId={id} />
    </Suspense>
  );
}