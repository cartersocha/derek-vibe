import { createClient } from '@/lib/supabase/server'
import { SessionsIndex } from '@/components/ui/sessions-index'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'
import { Suspense } from 'react'

async function SessionsList() {
  const supabase = await createClient()

  const [sessionsResult, charactersResult, campaignsResult, organizationsResult] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        id,
        name,
        campaign_id,
        session_date,
        created_at,
        campaign:campaigns(id, name)
      `)
      .order('session_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
  ])

  const sessions = sessionsResult.data ?? []
  const sessionIds = sessions.map((session) => session.id).filter((id): id is string => Boolean(id))
  const sessionIdSet = new Set(sessionIds)

  const [sessionCharactersResult, organizationSessionsResult] = sessionIds.length
    ? await Promise.all([
        supabase
          .from('session_characters')
          .select(`
            session_id,
            character:characters(
              id,
              name,
              player_type
            )
          `)
          .in('session_id', sessionIds),
        supabase
          .from('organization_sessions')
          .select(`
            session_id,
            organization:organizations(id, name)
          `)
          .in('session_id', sessionIds),
      ])
    : [null, null]

  if (sessionCharactersResult?.error) {
    throw new Error(sessionCharactersResult.error.message)
  }

  if (organizationSessionsResult?.error) {
    throw new Error(organizationSessionsResult.error.message)
  }

  type NamedEntity = { id: string; name: string }

  const organizationsBySession = new Map<string, NamedEntity[]>()
  const charactersBySession = new Map<string, (NamedEntity & { player_type: string | null })[]>()

  const pushOrganization = (sessionId: string, organization: NamedEntity | null) => {
    if (!organization?.id || !organization.name) {
      return
    }
    const bucket = organizationsBySession.get(sessionId) ?? []
    if (!bucket.some((entry) => entry.id === organization.id)) {
      bucket.push(organization)
      organizationsBySession.set(sessionId, bucket)
    }
  }

  const pushCharacter = (sessionId: string, character: (NamedEntity & { player_type: string | null }) | null) => {
    if (!character?.id || !character.name) {
      return
    }
    const bucket = charactersBySession.get(sessionId) ?? []
    if (!bucket.some((entry) => entry.id === character.id)) {
      bucket.push(character)
      charactersBySession.set(sessionId, bucket)
    }
  }

  const organizationRows = organizationSessionsResult?.data ?? []
  for (const row of organizationRows) {
    const sessionId = row.session_id
    if (!sessionId || !sessionIdSet.has(sessionId)) {
      continue
    }
    const organization = Array.isArray(row.organization) ? row.organization[0] : row.organization
    if (!organization?.id || !organization.name) {
      continue
    }
    pushOrganization(sessionId, { id: organization.id, name: organization.name })
  }

  const characterRows = sessionCharactersResult?.data ?? []
  for (const row of characterRows) {
    const sessionId = row.session_id
    if (!sessionId || !sessionIdSet.has(sessionId)) {
      continue
    }
    const character = Array.isArray(row.character) ? row.character[0] : row.character
    if (!character?.id || !character.name) {
      continue
    }
    pushCharacter(sessionId, {
      id: character.id,
      name: character.name,
      player_type: character.player_type ?? null,
    })
  }

  const enrichedSessions = sessions.map((session) => {
    const organizations = [...(organizationsBySession.get(session.id) ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    const characters = [...(charactersBySession.get(session.id) ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    
    return {
      ...session,
      organizations,
      characters,
    }
  })

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersResult.data ?? [], 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(campaignsResult.data ?? [], 'campaign', (entry) => `/campaigns/${entry.id}`),
    mapEntitiesToMentionTargets(organizationsResult.data ?? [], 'organization', (entry) => `/organizations/${entry.id}`),
    mapEntitiesToMentionTargets(sessions, 'session', (entry) => `/sessions/${entry.id}`)
  )
  return <SessionsIndex sessions={enrichedSessions} mentionTargets={mentionTargets} />
}

// Loading skeleton component
function SessionsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

export default async function SessionsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<SessionsLoading />}>
        <SessionsList />
      </Suspense>
    </div>
  );
}