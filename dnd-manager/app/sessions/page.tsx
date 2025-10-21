import { createClient } from '@/lib/supabase/server'
import { SessionsIndex } from '@/components/ui/sessions-index'
import { type MentionTarget } from '@/lib/mention-utils'
import { extractPlayerSummaries, dateStringToLocalDate, type SessionCharacterRelation } from '@/lib/utils'

export default async function SessionsPage() {
  const supabase = await createClient()

  const [sessionsResult, charactersResult, organizationsResult, campaignsResult, organizationMemberCountsResult] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        *,
        campaign:campaigns(id, name),
        session_characters:session_characters(
          character:characters(
            id,
            name,
            class,
            race,
            level,
            player_type,
            organization_memberships:organization_characters(
              organizations(id, name)
            )
          )
        ),
        session_organizations:organization_sessions(
          organization:organizations(id, name)
        )
      `)
      .order('session_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('organization_characters').select('organization_id'),
  ])

  const sessions = sessionsResult.data
  const mentionCharacters = charactersResult.data
  const organizations = organizationsResult.data
  const campaigns = campaignsResult.data

  // Process organization member counts
  const organizationMemberCounts = new Map<string, number>()
  organizationMemberCountsResult.data?.forEach(row => {
    const orgId = row.organization_id
    organizationMemberCounts.set(orgId, (organizationMemberCounts.get(orgId) || 0) + 1)
  })

  const sessionNumberMap = new Map<string, number>()

  if (sessions) {
    // Group sessions by campaign so we can assign per-campaign sequence numbers
    type SessionWithCampaign = typeof sessions extends (infer S)[] ? S : never
    const sessionsByCampaign = new Map<string, SessionWithCampaign[]>()

    for (const session of sessions) {
      if (!session.campaign_id) {
        continue
      }
      const bucket = sessionsByCampaign.get(session.campaign_id) ?? []
      bucket.push(session)
      sessionsByCampaign.set(session.campaign_id, bucket)
    }

    for (const [, campaignSessions] of sessionsByCampaign) {
      campaignSessions.sort((a, b) => {
        const aDate = dateStringToLocalDate(a.session_date)
        const bDate = dateStringToLocalDate(b.session_date)
        const aTime = aDate ? aDate.getTime() : Number.POSITIVE_INFINITY
        const bTime = bDate ? bDate.getTime() : Number.POSITIVE_INFINITY
        if (aTime === bTime) {
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
          return aCreated - bCreated
        }
        return aTime - bTime
      })

      let counter = 1
      for (const campaignSession of campaignSessions) {
        if (!campaignSession.session_date) {
          continue
        }
        sessionNumberMap.set(campaignSession.id, counter)
        counter += 1
      }
    }
  }

  const enrichedSessions = (sessions ?? []).map((session) => {
    const rawLinks = Array.isArray(session.session_characters)
      ? (session.session_characters as SessionCharacterRelation[])
      : null
    const players = extractPlayerSummaries(rawLinks)
    const campaignRelation = Array.isArray(session.campaign)
      ? session.campaign[0] ?? null
      : session.campaign ?? null

    const organizations = Array.isArray(session.session_organizations)
      ? session.session_organizations
          .map((entry: {
            organization:
              | { id: string | null; name: string | null }
              | { id: string | null; name: string | null }[]
              | null
          }) => {
            const org = Array.isArray(entry?.organization) ? entry?.organization?.[0] : entry?.organization
            if (!org?.id || !org?.name) {
              return null
            }
            return { id: org.id, name: org.name }
          })
          .filter((value: { id: string; name: string } | null): value is { id: string; name: string } => Boolean(value))
          .sort((a, b) => {
            const aCount = organizationMemberCounts.get(a.id) || 0
            const bCount = organizationMemberCounts.get(b.id) || 0
            
            // Sort by member count (descending), then by name (ascending) as tiebreaker
            if (aCount !== bCount) {
              return bCount - aCount
            }
            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          })
      : []

    return {
      ...session,
      sessionNumber: sessionNumberMap.get(session.id) ?? null,
      campaign: campaignRelation,
      players,
      organizations,
    }
  })

  const mentionTargets = (() => {
    const map = new Map<string, MentionTarget>()

    const addTarget = (target: MentionTarget) => {
      if (!target.id || !target.name) {
        return
      }
      map.set(`${target.kind}:${target.id}`, target)
    }

    for (const character of mentionCharacters ?? []) {
      if (!character?.id || !character?.name) {
        continue
      }
      addTarget({
        id: character.id,
        name: character.name,
        href: `/characters/${character.id}`,
        kind: 'character',
      })
    }

    for (const sessionEntry of sessions ?? []) {
      if (!sessionEntry?.id || !sessionEntry?.name) {
        continue
      }
      addTarget({
        id: sessionEntry.id,
        name: sessionEntry.name,
        href: `/sessions/${sessionEntry.id}`,
        kind: 'session',
      })
    }

    for (const organization of organizations ?? []) {
      if (!organization?.id || !organization?.name) {
        continue
      }
      addTarget({
        id: organization.id,
        name: organization.name,
        href: `/organizations/${organization.id}`,
        kind: 'organization',
      })
    }

    for (const campaign of campaigns ?? []) {
      if (!campaign?.id || !campaign?.name) {
        continue
      }
      addTarget({
        id: campaign.id,
        name: campaign.name,
        href: `/campaigns/${campaign.id}`,
        kind: 'campaign',
      })
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  })()

  return <SessionsIndex sessions={enrichedSessions} mentionTargets={mentionTargets} />
}
