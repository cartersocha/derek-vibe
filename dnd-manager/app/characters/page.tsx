import { createClient } from '@/lib/supabase/server'
import { CharactersIndex } from '@/components/ui/characters-index'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'
import { Suspense } from 'react'

async function CharactersList() {
  const supabase = await createClient()

  const [charactersResult, sessionsResult, campaignsResult, organizationsResult] = await Promise.all([
    supabase
      .from('characters')
      .select(`
        id,
        name,
        player_type,
        location,
        status,
        level,
        created_at
      `)
      .order('name'),
    supabase
      .from('sessions')
      .select('id, name, session_date, created_at')
      .order('session_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
  ])

  const characters = charactersResult.data ?? []
  const characterIds = characters.map((character) => character.id).filter((id): id is string => Boolean(id))
  const characterIdSet = new Set(characterIds)

  const [campaignCharactersResult, organizationCharactersResult, sessionCharactersResult] = characterIds.length
    ? await Promise.all([
        supabase
          .from('campaign_characters')
          .select(`
            character_id,
            campaign:campaigns(id, name)
          `)
          .in('character_id', characterIds),
        supabase
          .from('organization_characters')
          .select(`
            character_id,
            organization:organizations(id, name)
          `)
          .in('character_id', characterIds),
        supabase
          .from('session_characters')
          .select(`
            character_id,
            session:sessions(id, name, session_date, created_at)
          `)
          .in('character_id', characterIds),
      ])
    : [null, null, null]

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

  type NamedEntity = { id: string; name: string }

  const campaignsByCharacter = new Map<string, NamedEntity[]>()
  const organizationsByCharacter = new Map<string, NamedEntity[]>()
  const sessionsByCharacter = new Map<string, (NamedEntity & { timestamp?: number | null })[]>()

  const pushCampaign = (characterId: string, campaign: NamedEntity | null) => {
    if (!campaign?.id || !campaign.name) {
      return
    }
    const bucket = campaignsByCharacter.get(characterId) ?? []
    if (!bucket.some((entry) => entry.id === campaign.id)) {
      bucket.push(campaign)
      campaignsByCharacter.set(characterId, bucket)
    }
  }

  const pushOrganization = (characterId: string, organization: NamedEntity | null) => {
    if (!organization?.id || !organization.name) {
      return
    }
    const bucket = organizationsByCharacter.get(characterId) ?? []
    if (!bucket.some((entry) => entry.id === organization.id)) {
      bucket.push(organization)
      organizationsByCharacter.set(characterId, bucket)
    }
  }

  const pushSession = (characterId: string, session: (NamedEntity & { timestamp?: number | null }) | null) => {
    if (!session?.id || !session.name) {
      return
    }
    const bucket = sessionsByCharacter.get(characterId) ?? []
    if (!bucket.some((entry) => entry.id === session.id)) {
      bucket.push(session)
      sessionsByCharacter.set(characterId, bucket)
    }
  }

  // Process campaign relationships
  const campaignRows = isMissingCampaignCharactersTable(campaignCharactersResult?.error)
    ? []
    : campaignCharactersResult?.data ?? []
  for (const row of campaignRows) {
    const characterId = row.character_id
    if (!characterId || !characterIdSet.has(characterId)) {
      continue
    }
    const campaign = Array.isArray(row.campaign) ? row.campaign[0] : row.campaign
    if (!campaign?.id || !campaign.name) {
      continue
    }
    pushCampaign(characterId, { id: campaign.id, name: campaign.name })
  }

  // Process organization relationships
  const organizationRows = organizationCharactersResult?.data ?? []
  for (const row of organizationRows) {
    const characterId = row.character_id
    if (!characterId || !characterIdSet.has(characterId)) {
      continue
    }
    const organization = Array.isArray(row.organization) ? row.organization[0] : row.organization
    if (!organization?.id || !organization.name) {
      continue
    }
    pushOrganization(characterId, { id: organization.id, name: organization.name })
  }

  // Process session relationships
  const sessionRows = isMissingSessionCharactersTable(sessionCharactersResult?.error)
    ? []
    : sessionCharactersResult?.data ?? []
  for (const row of sessionRows) {
    const characterId = row.character_id
    if (!characterId || !characterIdSet.has(characterId)) {
      continue
    }
    const session = Array.isArray(row.session) ? row.session[0] : row.session
    if (!session?.id || !session.name) {
      continue
    }
    const timestampSource = session.session_date ?? session.created_at ?? null
    const timestamp = timestampSource ? new Date(timestampSource).getTime() : Number.NEGATIVE_INFINITY
    pushSession(characterId, { id: session.id, name: session.name, timestamp })
  }

  const enrichedCharacters = characters.map((character) => {
    const campaigns = [...(campaignsByCharacter.get(character.id) ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    const organizations = [...(organizationsByCharacter.get(character.id) ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    const sessions = [...(sessionsByCharacter.get(character.id) ?? [])]
      .sort((a, b) => (b.timestamp ?? Number.NEGATIVE_INFINITY) - (a.timestamp ?? Number.NEGATIVE_INFINITY))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
      }))
    
    return {
      ...character,
      campaigns,
      organizations,
      sessions,
    }
  })

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(sessionsResult.data ?? [], 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(campaignsResult.data ?? [], 'campaign', (entry) => `/campaigns/${entry.id}`),
    mapEntitiesToMentionTargets(organizationsResult.data ?? [], 'organization', (entry) => `/organizations/${entry.id}`),
    mapEntitiesToMentionTargets(characters, 'character', (entry) => `/characters/${entry.id}`)
  )
  return <CharactersIndex characters={enrichedCharacters} mentionTargets={mentionTargets} />
}

// Loading skeleton component
function CharactersLoading() {
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

export default async function CharactersPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<CharactersLoading />}>
        <CharactersList />
      </Suspense>
    </div>
  );
}