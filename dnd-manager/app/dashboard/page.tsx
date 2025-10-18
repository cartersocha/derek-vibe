import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  extractPlayerSummaries,
  getVisiblePlayers,
  type SessionCharacterRelation,
} from '@/lib/utils'

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
        character:characters(id, name, class, race, level)
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
      await Promise.all(
        campaignIds.map(async (campaignId) => {
          const { data: campaignSessions } = await supabase
            .from('sessions')
            .select('id, session_date, created_at')
            .eq('campaign_id', campaignId)
            .order('session_date', { ascending: true, nullsFirst: true })
            .order('created_at', { ascending: true })

          if (!campaignSessions) return

          let counter = 1
          for (const campaignSession of campaignSessions) {
            if (!campaignSession.session_date) continue
            sessionNumberMap.set(campaignSession.id, counter)
            counter += 1
          }
        })
      )
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
              const scheduledDate = session.session_date
                ? new Date(session.session_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : null
              const campaignRelation = Array.isArray(session.campaign)
                ? session.campaign[0]
                : session.campaign
              const rawLinks = Array.isArray(session.session_characters)
                ? (session.session_characters as SessionCharacterRelation[])
                : null
              const players = extractPlayerSummaries(rawLinks)
              const { visible: visiblePlayers, hiddenCount } = getVisiblePlayers(players, 4)

              return (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex h-full flex-col gap-4 rounded-lg border border-[#00ffff] border-opacity-25 bg-[#0f0f23] p-5 transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[0_0_25px_rgba(255,0,255,0.35)]"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#00ffff] font-mono tracking-wider">
                        {session.name}
                      </h3>
                      {sessionNumber !== undefined && sessionNumber !== null && (
                        <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-[11px] font-mono uppercase tracking-widest text-[#ff00ff]">
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
                      <div className="mt-3 flex flex-wrap gap-2">
                        {visiblePlayers.map((player) => (
                          <span
                            key={`${session.id}-${player.id}`}
                            className="rounded border border-[#00ffff] border-opacity-25 bg-[#0f0f23] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[#00ffff]"
                          >
                            {player.name}
                          </span>
                        ))}
                        {hiddenCount > 0 && (
                          <span className="rounded border border-dashed border-[#00ffff]/40 bg-[#0f0f23] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[#00ffff]/70">
                            +{hiddenCount} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-gray-400 font-mono uppercase tracking-wider">
                    {scheduledDate ? (
                      <span>Session Date: {scheduledDate}</span>
                    ) : (
                      <span>Session Date: Not set</span>
                    )}
                  </div>
                  {session.notes && (
                    <p className="text-sm text-gray-300 font-mono line-clamp-3 leading-relaxed">
                      {session.notes}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
