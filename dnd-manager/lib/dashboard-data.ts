import { createClient } from '@/lib/supabase/server'
import { extractPlayerSummaries, type SessionCharacterRelation } from '@/lib/utils'

export interface DashboardStats {
  campaignsCount: number
  sessionsCount: number
  charactersCount: number
}

export interface DashboardSession {
  id: string
  name: string
  session_date: string | null
  created_at: string
  campaign_id: string | null
  campaign: { id: string; name: string } | null
  session_characters: SessionCharacterRelation[] | null
  session_organizations: Array<{
    organization: { id: string; name: string } | null
  }>
  sessionNumber?: number
  players: Array<{
    id: string
    name: string
    class: string | null
    race: string | null
    level: string | null
    player_type: "npc" | "player" | null
    organizations: Array<{ id: string; name: string }>
  }>
  organizations: Array<{ id: string; name: string }>
}

export interface DashboardData {
  stats: DashboardStats
  recentSessions: DashboardSession[]
}

/**
 * Optimized data fetching for dashboard with caching and reduced queries
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  // Fetch all data in parallel for better performance
  const [
    { count: campaignsCount },
    { count: sessionsCount },
    { count: charactersCount },
    { data: recentSessions }
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('characters').select('*', { count: 'exact', head: true }),
    supabase
      .from('sessions')
      .select(`
        id,
        name,
        session_date,
        created_at,
        campaign_id,
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
      .order('created_at', { ascending: false })
      .limit(3)
  ])

  // Process session data efficiently
  const processedSessions: DashboardSession[] = []

  if (recentSessions && recentSessions.length > 0) {
    // Process each session
    for (const session of recentSessions) {
      const campaignRelation = Array.isArray(session.campaign)
        ? session.campaign[0]
        : session.campaign

      const rawLinks = Array.isArray(session.session_characters)
        ? (session.session_characters as SessionCharacterRelation[])
        : null

      const players = extractPlayerSummaries(rawLinks)

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
        : []

      processedSessions.push({
        id: session.id,
        name: session.name,
        session_date: session.session_date,
        created_at: session.created_at,
        campaign_id: session.campaign_id,
        campaign: campaignRelation,
        session_characters: rawLinks,
        session_organizations: [],
        // Removed expensive cross-campaign session numbering query
        // sessionNumber intentionally omitted for performance
        players,
        organizations
      })
    }
  }

  return {
    stats: {
      campaignsCount: campaignsCount || 0,
      sessionsCount: sessionsCount || 0,
      charactersCount: charactersCount || 0
    },
    recentSessions: processedSessions
  }
}
