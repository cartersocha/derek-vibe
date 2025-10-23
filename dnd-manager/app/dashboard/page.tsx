import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  extractPlayerSummaries,
  dateStringToLocalDate,
  formatDateStringForDisplay,
  type SessionCharacterRelation,
} from '@/lib/utils'
import { DashboardSessionCard } from '@/components/ui/dashboard-session-card'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch statistics
  const [
    { count: campaignsCount },
    { count: sessionsCount },
    { count: charactersCount },
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('characters').select('*', { count: 'exact', head: true }),
  ])

  // Fetch recent sessions
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select(`
      id,
      name,
      session_date,
      created_at,
      campaign_id,
      notes,
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

  const sessionNumberMap = new Map<string, number>()

  if (recentSessions && recentSessions.length > 0) {
    const campaignIds = Array.from(
      new Set(
        recentSessions
          .map((session) => session.campaign_id)
          .filter((campaignId): campaignId is string => Boolean(campaignId))
      )
    )

    if (campaignIds.length > 0) {
      const { data: relatedSessions } = await supabase
        .from('sessions')
        .select('id, campaign_id, session_date, created_at')
        .in('campaign_id', campaignIds)

      if (relatedSessions) {
        const groupedByCampaign = relatedSessions.reduce<Map<string, typeof relatedSessions>>((acc, session) => {
          if (!session.campaign_id) {
            return acc
          }
          const existing = acc.get(session.campaign_id)
          if (existing) {
            existing.push(session)
          } else {
            acc.set(session.campaign_id, [session])
          }
          return acc
        }, new Map())

        groupedByCampaign.forEach((sessions) => {
          const sorted = sessions
            .filter((session) => Boolean(session.session_date))
            .sort((a, b) => {
              if (a.session_date && b.session_date) {
                const aDate = dateStringToLocalDate(a.session_date)
                const bDate = dateStringToLocalDate(b.session_date)
                if (aDate && bDate) {
                  const dateCompare = aDate.getTime() - bDate.getTime()
                  if (dateCompare !== 0) {
                    return dateCompare
                  }
                }
              }

              const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
              const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
              return aCreated - bCreated
            })

          let counter = 1
          for (const session of sorted) {
            sessionNumberMap.set(session.id, counter)
            counter += 1
          }
        })
      }
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="retro-title glitch-subtle text-2xl sm:text-3xl font-bold text-[#00ffff] break-words" data-text="DASHBOARD">Dashboard</h1>
      </div>

      {/* Recent Sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-4 sm:p-6 lg:p-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Recent Sessions</h2>
            <p className="text-xs sm:text-sm text-gray-400 font-mono">Your latest adventures at a glance</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {recentSessions.map((session) => {
              const sessionNumber = sessionNumberMap.get(session.id)
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

              return (
                <DashboardSessionCard
                  key={session.id}
                  session={{
                    id: session.id,
                    name: session.name,
                    session_date: session.session_date,
                    created_at: session.created_at,
                    campaign: campaignRelation,
                    session_characters: rawLinks,
                    session_organizations: []
                  }}
                  sessionNumber={sessionNumber}
                  players={players}
                  organizations={organizations}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link
          href="/campaigns"
          className="group block rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/40 focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-[#050517] min-h-[100px] flex flex-col justify-center"
        >
          <h3 className="text-xs sm:text-sm font-medium text-[#fcee0c] uppercase tracking-wider font-mono">Total Campaigns</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#00ffff]">{campaignsCount || 0}</p>
        </Link>

        <Link
          href="/sessions"
          className="group block rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/40 focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-[#050517] min-h-[100px] flex flex-col justify-center"
        >
          <h3 className="text-xs sm:text-sm font-medium text-[#fcee0c] uppercase tracking-wider font-mono">Total Sessions</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#00ffff]">{sessionsCount || 0}</p>
        </Link>

        <Link
          href="/characters"
          className="group block rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/40 focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-[#050517] min-h-[100px] flex flex-col justify-center sm:col-span-2 lg:col-span-1"
        >
          <h3 className="text-xs sm:text-sm font-medium text-[#fcee0c] uppercase tracking-wider font-mono">Total Characters</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#00ffff]">{charactersCount || 0}</p>
        </Link>
      </div>
    </div>
  )
}
