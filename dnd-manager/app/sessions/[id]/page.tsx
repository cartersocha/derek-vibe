import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'
import { Suspense } from 'react'
import SessionDetail from '@/components/sessions/session-detail'

async function SessionContent({ sessionId }: { sessionId: string }) {
  const supabase = await createClient()

  const [sessionResult, sessionCharactersResult, organizationSessionsResult, charactersResult, campaignsResult, organizationsResult] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        id,
        name,
        campaign_id,
        session_date,
        created_at,
        summary,
        notes,
        campaign:campaigns(id, name)
      `)
      .eq('id', sessionId)
      .single(),
    supabase
      .from('session_characters')
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
      .eq('session_id', sessionId),
    supabase
      .from('organization_sessions')
      .select(`
        organization:organizations(
          id,
          name,
          description
        )
      `)
      .eq('session_id', sessionId),
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
  ])

  if (sessionResult.error) {
    throw new Error(sessionResult.error.message)
  }

  const session = sessionResult.data
  if (!session) {
    notFound();
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

  if (sessionCharactersResult?.error && !isMissingSessionCharactersTable(sessionCharactersResult.error)) {
    throw new Error(sessionCharactersResult.error.message)
  }

  if (organizationSessionsResult?.error) {
    throw new Error(organizationSessionsResult.error.message)
  }

  // Process characters
  const characters = isMissingSessionCharactersTable(sessionCharactersResult?.error)
    ? []
    : sessionCharactersResult?.data
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
  const organizations = organizationSessionsResult?.data
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

  // Create mention targets
  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersResult.data ?? [], 'character', (character) => `/characters/${character.id}`),
    mapEntitiesToMentionTargets(campaignsResult.data ?? [], 'campaign', (campaign) => `/campaigns/${campaign.id}`),
    mapEntitiesToMentionTargets(organizationsResult.data ?? [], 'organization', (organization) => `/organizations/${organization.id}`),
    mapEntitiesToMentionTargets([session], 'session', (entry) => `/sessions/${entry.id}`)
  );

  return (
    <SessionDetail
      session={session}
      characters={characters}
      organizations={organizations}
      mentionTargets={mentionTargets}
    />
  );
}

// Loading skeleton component
function SessionLoading() {
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

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<SessionLoading />}>
      <SessionContent sessionId={id} />
    </Suspense>
  );
}