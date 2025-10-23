import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  extractPlayerSummaries,
  formatDateStringForDisplay,
  type SessionCharacterRelation,
} from '@/lib/utils'
import { DashboardSessionCard } from '@/components/ui/dashboard-session-card'
import { Suspense } from 'react'

async function DashboardStats() {
  const supabase = await createClient()
  const { data: stats } = await supabase.rpc('get_dashboard_stats')
  const dashboardStats = stats?.[0] || { campaigns_count: 0, sessions_count: 0, characters_count: 0 }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <Link
        href="/campaigns"
        className="group block rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/40 focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-[#050517] min-h-[100px] flex flex-col justify-center"
      >
        <h3 className="text-xs sm:text-sm font-medium text-[#fcee0c] uppercase tracking-wider font-mono">Total Campaigns</h3>
        <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#00ffff]">{dashboardStats.campaigns_count || 0}</p>
      </Link>

      <Link
        href="/sessions"
        className="group block rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/40 focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-[#050517] min-h-[100px] flex flex-col justify-center"
      >
        <h3 className="text-xs sm:text-sm font-medium text-[#fcee0c] uppercase tracking-wider font-mono">Total Sessions</h3>
        <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#00ffff]">{dashboardStats.sessions_count || 0}</p>
      </Link>

      <Link
        href="/characters"
        className="group block rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/40 focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-[#050517] min-h-[100px] flex flex-col justify-center sm:col-span-2 lg:col-span-1"
      >
        <h3 className="text-xs sm:text-sm font-medium text-[#fcee0c] uppercase tracking-wider font-mono">Total Characters</h3>
        <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#00ffff]">{dashboardStats.characters_count || 0}</p>
      </Link>
    </div>
  )
}

async function RecentSessions() {
  const supabase = await createClient()
  
  // Optimized query with reduced nested relations
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select(`
      id,
      name,
      session_date,
      created_at,
      campaign_id,
      campaign:campaigns(id, name),
      session_characters:session_characters(
        character:characters(id, name, class, race, level, player_type)
      ),
      session_organizations:organization_sessions(
        organization:organizations(id, name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(3)

  if (!recentSessions || recentSessions.length === 0) {
    return null
  }

  // Get session numbers using the database function
  const sessionIds = recentSessions.map(s => s.id)
  const { data: sessionNumbers } = await supabase
    .rpc('get_session_numbers', { session_ids: sessionIds })

  const sessionNumberMap = new Map<string, number>()
  if (sessionNumbers) {
    sessionNumbers.forEach((item: { session_id: string; session_number: number }) => {
      sessionNumberMap.set(item.session_id, item.session_number)
    })
  }

  return (
    <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Recent Sessions</h2>
        <p className="text-xs sm:text-sm text-gray-400 font-mono">Your latest adventures at a glance</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {recentSessions.map((session: any) => {
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
  )
}

export default async function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="retro-title glitch-subtle text-2xl sm:text-3xl font-bold text-[#00ffff] break-words" data-text="DASHBOARD">Dashboard</h1>
      </div>

      {/* Recent Sessions */}
      <Suspense fallback={
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-4 sm:p-6 lg:p-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Recent Sessions</h2>
            <p className="text-xs sm:text-sm text-gray-400 font-mono">Your latest adventures at a glance</p>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-[#1a1a3e] rounded"></div>
            <div className="h-24 bg-[#1a1a3e] rounded"></div>
            <div className="h-24 bg-[#1a1a3e] rounded"></div>
          </div>
        </div>
      }>
        <RecentSessions />
      </Suspense>

      {/* Statistics */}
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="animate-pulse bg-[#1a1a3e]/80 rounded-lg p-4 sm:p-6 min-h-[100px]"></div>
          <div className="animate-pulse bg-[#1a1a3e]/80 rounded-lg p-4 sm:p-6 min-h-[100px]"></div>
          <div className="animate-pulse bg-[#1a1a3e]/80 rounded-lg p-4 sm:p-6 min-h-[100px]"></div>
        </div>
      }>
        <DashboardStats />
      </Suspense>
    </div>
  )
}
