import { createClient } from '@/lib/supabase/server'
import { CampaignsIndex } from '@/components/ui/campaigns-index'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'

export const runtime = 'edge'
export const revalidate = 300
export const fetchCache = 'force-cache'

export default async function CampaignsPage() {
  const supabase = await createClient()

  const [campaignsResult, charactersResult, sessionsResult, groupsResult, groupMemberCountsResult] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('characters').select('id, name').order('name'),
    supabase
      .from('sessions')
      .select('id, name, campaign_id, session_date, created_at')
      .order('session_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('groups').select('id, name').order('name'),
    supabase.from('group_characters').select('group_id'),
  ])

  const campaigns = campaignsResult.data ?? []
  const campaignIds = campaigns.map((campaign) => campaign.id).filter((id): id is string => Boolean(id))
  const campaignIdSet = new Set(campaignIds)

  // Process group member counts
  const groupMemberCounts = new Map<string, number>()
  groupMemberCountsResult.data?.forEach(row => {
    const orgId = row.group_id
    groupMemberCounts.set(orgId, (groupMemberCounts.get(orgId) || 0) + 1)
  })

  const [campaignCharactersResult, groupCampaignsResult] = campaignIds.length
    ? await Promise.all([
        supabase
          .from('campaign_characters')
          .select(`
            campaign_id,
            character:characters(
              id,
              name,
              player_type
            )
          `)
          .in('campaign_id', campaignIds),
        supabase
          .from('group_campaigns')
          .select(`
            campaign_id,
            group:groups(id, name)
          `)
          .in('campaign_id', campaignIds),
      ])
    : [null, null]

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

  if (groupCampaignsResult?.error) {
    throw new Error(groupCampaignsResult.error.message)
  }

  type NamedEntity = { id: string; name: string }

  const groupsByCampaign = new Map<string, NamedEntity[]>()
  const charactersByCampaign = new Map<string, (NamedEntity & { player_type: string | null })[]>()
  const sessionsByCampaign = new Map<string, (NamedEntity & { timestamp?: number | null })[]>()

  const pushGroup = (campaignId: string, group: NamedEntity | null) => {
    if (!group?.id || !group.name) {
      return
    }
    const bucket = groupsByCampaign.get(campaignId) ?? []
    if (!bucket.some((entry) => entry.id === group.id)) {
      bucket.push(group)
      groupsByCampaign.set(campaignId, bucket)
    }
  }

  const pushCharacter = (campaignId: string, character: (NamedEntity & { player_type: string | null }) | null) => {
    if (!character?.id || !character.name) {
      return
    }
    const bucket = charactersByCampaign.get(campaignId) ?? []
    if (!bucket.some((entry) => entry.id === character.id)) {
      bucket.push(character)
      charactersByCampaign.set(campaignId, bucket)
    }
  }

  const pushSession = (campaignId: string, session: (NamedEntity & { timestamp?: number | null }) | null) => {
    if (!session?.id || !session.name) {
      return
    }
    const bucket = sessionsByCampaign.get(campaignId) ?? []
    if (!bucket.some((entry) => entry.id === session.id)) {
      bucket.push(session)
      sessionsByCampaign.set(campaignId, bucket)
    }
  }

  const groupRows = groupCampaignsResult?.data ?? []
  for (const row of groupRows) {
    const campaignId = row.campaign_id
    if (!campaignId || !campaignIdSet.has(campaignId)) {
      continue
    }
    const group = Array.isArray(row.group) ? row.group[0] : row.group
    if (!group?.id || !group.name) {
      continue
    }
    pushGroup(campaignId, { id: group.id, name: group.name })
  }

  const characterRows = isMissingCampaignCharactersTable(campaignCharactersResult?.error)
    ? []
    : campaignCharactersResult?.data ?? []
  for (const row of characterRows) {
    const campaignId = row.campaign_id
    if (!campaignId || !campaignIdSet.has(campaignId)) {
      continue
    }
    const character = Array.isArray(row.character) ? row.character[0] : row.character
    if (!character?.id || !character.name) {
      continue
    }
    pushCharacter(campaignId, {
      id: character.id,
      name: character.name,
      player_type: character.player_type ?? null,
    })
  }

  const sessionRows = sessionsResult.data ?? []
  for (const session of sessionRows) {
    const campaignId = (session as { campaign_id?: string | null }).campaign_id
    if (!campaignId || !campaignIdSet.has(campaignId)) {
      continue
    }
    const sessionName = session.name
    const sessionId = session.id
    if (!sessionId || !sessionName) {
      continue
    }
    const timestampSource =
      (session as { session_date?: string | null }).session_date ??
      (session as { created_at?: string | null }).created_at ??
      null
    const timestamp = timestampSource ? new Date(timestampSource).getTime() : Number.NEGATIVE_INFINITY
    pushSession(campaignId, { id: sessionId, name: sessionName, timestamp })
  }

  const enrichedCampaigns = campaigns.map((campaign) => {
    const groups = [...(groupsByCampaign.get(campaign.id) ?? [])].sort((a, b) => {
      const aCount = groupMemberCounts.get(a.id) || 0
      const bCount = groupMemberCounts.get(b.id) || 0
      
      // Sort by member count (descending), then by name (ascending) as tiebreaker
      if (aCount !== bCount) {
        return bCount - aCount
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
    const characters = [...(charactersByCampaign.get(campaign.id) ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    const allSessions = [...(sessionsByCampaign.get(campaign.id) ?? [])]
      .sort((a, b) => (b.timestamp ?? Number.NEGATIVE_INFINITY) - (a.timestamp ?? Number.NEGATIVE_INFINITY))
    const sessionPreview = allSessions.slice(0, 3).map((entry) => ({
      id: entry.id,
      name: entry.name,
    }))
    const allSessionsFormatted = allSessions.map((entry) => ({
      id: entry.id,
      name: entry.name,
    }))
    return {
      ...campaign,
      groups,
      characters,
      sessions: sessionPreview,
      allSessions: allSessionsFormatted,
      sessionCount: allSessions.length,
    }
  })

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersResult.data ?? [], 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(sessionsResult.data ?? [], 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(groupsResult.data ?? [], 'group', (entry) => `/groups/${entry.id}`),
    mapEntitiesToMentionTargets(campaigns, 'campaign', (entry) => `/campaigns/${entry.id}`)
  )
  return <CampaignsIndex campaigns={enrichedCampaigns} mentionTargets={mentionTargets} />
}
