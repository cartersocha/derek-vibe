import Link from 'next/link'
import { DashboardSessionCard } from '@/components/ui/dashboard-session-card'
import { getDashboardData } from '@/lib/dashboard-data'

// Cache configuration for edge caching
export const revalidate = 300 // Revalidate every 5 minutes
export const dynamic = 'force-dynamic' // Ensure fresh data for authenticated users
export const fetchCache = 'force-cache' // Enable edge caching
export const runtime = 'edge' // Use edge runtime for better performance

export default async function DashboardPage() {
  // Use optimized data fetching
  const { stats, recentSessions } = await getDashboardData()

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="retro-title glitch-subtle text-base sm:text-lg md:text-xl font-bold text-[var(--cyber-cyan)] break-words" data-text="DASHBOARD">Dashboard</h1>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link
          href="/campaigns"
          className="group block rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[var(--cyber-magenta)] hover:shadow-[var(--cyber-magenta)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)] focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)] min-h-[100px] flex flex-col justify-center"
        >
          <h3 className="text-xs sm:text-sm font-medium text-[var(--cyber-magenta)] uppercase tracking-wider font-mono">Total Campaigns</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--cyber-cyan)]">{stats.campaignsCount}</p>
        </Link>

        <Link
          href="/sessions"
          className="group block rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[var(--cyber-magenta)] hover:shadow-[var(--cyber-magenta)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)] focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)] min-h-[100px] flex flex-col justify-center"
        >
          <h3 className="text-xs sm:text-sm font-medium text-[var(--cyber-magenta)] uppercase tracking-wider font-mono">Total Sessions</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--cyber-cyan)]">{stats.sessionsCount}</p>
        </Link>

        <Link
          href="/characters"
          className="group block rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)]/80 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[var(--cyber-magenta)] hover:shadow-[var(--cyber-magenta)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)] focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)] min-h-[100px] flex flex-col justify-center sm:col-span-2 lg:col-span-1"
        >
          <h3 className="text-xs sm:text-sm font-medium text-[var(--cyber-magenta)] uppercase tracking-wider font-mono">Total Characters</h3>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--cyber-cyan)]">{stats.charactersCount}</p>
        </Link>
      </div>

      {/* Recent Sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div className="bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl p-4 sm:p-6 lg:p-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">Recent Sessions</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {recentSessions.map((session) => (
              <DashboardSessionCard
                key={session.id}
                session={{
                  id: session.id,
                  name: session.name,
                  session_date: session.session_date,
                  created_at: session.created_at,
                  campaign: session.campaign,
                  session_characters: session.session_characters,
                  session_organizations: session.session_organizations
                }}
                sessionNumber={session.sessionNumber}
                players={session.players}
                organizations={session.organizations}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
