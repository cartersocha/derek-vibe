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
    .select('id, name, session_date, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back to your D&D Campaign Manager</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Campaigns</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{campaignsCount || 0}</p>
          <Link href="/campaigns" className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{sessionsCount || 0}</p>
          <Link href="/sessions" className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Characters</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{charactersCount || 0}</p>
          <Link href="/characters" className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm">
            View all →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/campaigns/new"
            className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            + New Campaign
          </Link>
          <Link
            href="/sessions/new"
            className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            + New Session
          </Link>
          <Link
            href="/characters/new"
            className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            + New Character
          </Link>
        </div>
      </div>

      {/* Recent Sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Sessions</h2>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">{session.name}</h3>
                  <span className="text-sm text-gray-500">
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
