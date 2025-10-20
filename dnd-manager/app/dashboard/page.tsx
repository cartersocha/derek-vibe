import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  extractPlayerSummaries,
  dateStringToLocalDate,
  formatDateStringForDisplay,
  type SessionCharacterRelation,
} from '@/lib/utils'
import { SessionParticipantPills } from '@/components/ui/session-participant-pills'

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
    <div className="space-y-8">
      <div>
        <h1 className="retro-title glitch-subtle text-3xl font-bold text-[#00ffff]" data-text="DASHBOARD">Dashboard</h1>
      </div>

      {/* Recent Sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Recent Sessions</h2>
            <p className="text-sm text-gray-400 font-mono">Your latest adventures at a glance</p>
          </div>
          <div className="grid grid-cols-1 gap-5">
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
                <article
                  key={session.id}
                  className="group relative overflow-hidden rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e] bg-opacity-50 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50"
                >
                  <Link
                    href={`/sessions/${session.id}`}
                    className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                    aria-label={`View session ${session.name}`}
                  >
                    <span aria-hidden="true" />
                  </Link>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 relative z-10 pointer-events-none">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-xl font-bold text-[#00ffff] uppercase tracking-wider transition-colors group-hover:text-[#ff00ff]">
                          {session.name}
                        </span>
                        {sessionNumber !== undefined && sessionNumber !== null && (
                          <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[#ff00ff]">
                            Session #{sessionNumber}
                          </span>
                        )}
                      </div>
                      {campaignRelation?.name && campaignRelation.id && (
                        <Link
                          href={`/campaigns/${campaignRelation.id}`}
                          className="pointer-events-auto inline-flex text-xs font-mono uppercase tracking-widest text-[#ff6b35] transition-colors hover:text-[#ff8a5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                        >
                          Campaign: {campaignRelation.name}
                        </Link>
                      )}
                      {players.length > 0 && (
                        <SessionParticipantPills
                          sessionId={session.id}
                          players={players}
                          className={`pointer-events-auto ${organizations.length > 0 ? 'mt-3' : 'mt-3'}`}
                          showOrganizations={false}
                        />
                      )}
                      {organizations.length > 0 && (
                        <div className={`flex flex-wrap gap-2 pointer-events-auto ${players.length > 0 ? 'mt-2' : 'mt-3'}`}>
                          {organizations.map((organization) => (
                            <Link
                              key={organization.id}
                              href={`/organizations/${organization.id}`}
                              className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447]"
                            >
                              {organization.name}
                            </Link>
                          ))}
                        </div>
                      )}
                  </div>
                  <div className="relative z-10 pointer-events-none text-xs font-mono uppercase tracking-wider text-gray-500 sm:ml-4 sm:text-right">
                    {session.session_date ? (
                      <div>{formatDateStringForDisplay(session.session_date) ?? 'No date set'}</div>
                    ) : (
                      <div>No date set</div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/campaigns"
          className="group block rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/80 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/40 focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-[#050517]"
        >
          <h3 className="text-sm font-medium text-[#fcee0c] uppercase tracking-wider font-mono">Total Campaigns</h3>
          <p className="mt-2 text-3xl font-bold text-[#00ffff]">{campaignsCount || 0}</p>
        </Link>

        <Link
          href="/sessions"
          className="group block rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/80 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/40 focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-[#050517]"
        >
          <h3 className="text-sm font-medium text-[#fcee0c] uppercase tracking-wider font-mono">Total Sessions</h3>
          <p className="mt-2 text-3xl font-bold text-[#00ffff]">{sessionsCount || 0}</p>
        </Link>

        <Link
          href="/characters"
          className="group block rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/80 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/40 focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-[#050517]"
        >
          <h3 className="text-sm font-medium text-[#fcee0c] uppercase tracking-wider font-mono">Total Characters</h3>
          <p className="mt-2 text-3xl font-bold text-[#00ffff]">{charactersCount || 0}</p>
        </Link>
      </div>
    </div>
  )
}
