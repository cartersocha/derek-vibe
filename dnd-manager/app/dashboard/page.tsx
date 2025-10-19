import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  extractPlayerSummaries,
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
      )
    `)
    .order('created_at', { ascending: false })
    .limit(6)

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
                const dateCompare = new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
                if (dateCompare !== 0) {
                  return dateCompare
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
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider glitch-subtle" data-text="DASHBOARD">Dashboard</h1>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider font-mono">Total Campaigns</h3>
          <p className="mt-2 text-3xl font-bold text-[#00ffff]">{campaignsCount || 0}</p>
          <Link href="/campaigns" className="mt-4 inline-block text-[#ff00ff] hover:text-[#cc00cc] text-sm font-mono uppercase tracking-wider">
            View all →
          </Link>
        </div>

        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider font-mono">Total Sessions</h3>
          <p className="mt-2 text-3xl font-bold text-[#00ffff]">{sessionsCount || 0}</p>
          <Link href="/sessions" className="mt-4 inline-block text-[#ff00ff] hover:text-[#cc00cc] text-sm font-mono uppercase tracking-wider">
            View all →
          </Link>
        </div>

        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider font-mono">Total Characters</h3>
          <p className="mt-2 text-3xl font-bold text-[#00ffff]">{charactersCount || 0}</p>
          <Link href="/characters" className="mt-4 inline-block text-[#ff00ff] hover:text-[#cc00cc] text-sm font-mono uppercase tracking-wider">
            View all →
          </Link>
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Recent Sessions</h2>
              <p className="text-sm text-gray-400 font-mono">Your latest adventures at a glance</p>
            </div>
            <Link
              href="/sessions"
              className="text-[#ff00ff] hover:text-[#cc00cc] text-sm font-mono uppercase tracking-wider"
            >
              View all sessions →
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {recentSessions.map((session) => {
              const sessionNumber = sessionNumberMap.get(session.id)
              const campaignRelation = Array.isArray(session.campaign)
                ? session.campaign[0]
                : session.campaign
              const rawLinks = Array.isArray(session.session_characters)
                ? (session.session_characters as SessionCharacterRelation[])
                : null
              const players = extractPlayerSummaries(rawLinks)

              return (
                <article
                  key={session.id}
                  className="group bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Link
                          href={`/sessions/${session.id}`}
                          className="text-xl font-bold text-[#00ffff] uppercase tracking-wider transition-colors hover:text-[#ff00ff] focus:text-[#ff00ff] focus:outline-none"
                        >
                          {session.name}
                        </Link>
                        {sessionNumber !== undefined && sessionNumber !== null && (
                          <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[#ff00ff]">
                            Session #{sessionNumber}
                          </span>
                        )}
                      </div>
                      {campaignRelation?.name && (
                        <p className="text-xs text-[#ff00ff] font-mono uppercase tracking-widest">
                          Campaign: {campaignRelation.name}
                        </p>
                      )}
                      {players.length > 0 && (
                        <SessionParticipantPills sessionId={session.id} players={players} className="mt-3" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-mono uppercase tracking-wider sm:text-right sm:ml-4">
                      {session.session_date ? (
                        <div>{new Date(session.session_date).toLocaleDateString()}</div>
                      ) : (
                        <div>No date set</div>
                      )}
                      <Link
                        href={`/sessions/${session.id}`}
                        className="mt-3 inline-flex text-[#ff00ff] text-[10px] uppercase tracking-widest font-bold hover:text-[#ff6ad5] focus:text-[#ff6ad5] focus:outline-none"
                      >
                        View session →
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
