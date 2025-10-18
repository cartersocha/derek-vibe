import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
    .select('id, name, session_date, created_at, campaign_id')
    .order('created_at', { ascending: false })
    .limit(5)

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
        <p className="mt-2 text-gray-400 font-mono">Welcome back to your D&D Campaign Manager</p>
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
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6">
          <h2 className="text-xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Recent Sessions</h2>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block p-3 rounded border border-[#00ffff] border-opacity-20 hover:border-[#ff00ff] hover:bg-[#0f0f23] transition-all duration-200"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-[#00ffff] font-mono">{session.name}</h3>
                    {sessionNumberMap.has(session.id) && (
                      <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-[#ff00ff]">
                        Session #{sessionNumberMap.get(session.id)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400 font-mono uppercase tracking-wider">
                    {session.session_date 
                      ? new Date(session.session_date).toLocaleDateString()
                      : new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
