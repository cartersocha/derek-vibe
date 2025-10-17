import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function SessionsPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      campaign:campaigns(name)
    `)
    .order('session_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
        <Link
          href="/sessions/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Session
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
          <p className="text-gray-600 mb-6">Create your first session to get started</p>
          <Link
            href="/sessions/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Session
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{session.name}</h3>
                  {session.campaign && (
                    <p className="text-sm text-blue-600 mb-2">
                      Campaign: {session.campaign.name}
                    </p>
                  )}
                  {session.notes && (
                    <p className="text-gray-600 line-clamp-2">{session.notes}</p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500 ml-4">
                  {session.session_date ? (
                    <div>{new Date(session.session_date).toLocaleDateString()}</div>
                  ) : (
                    <div>No date set</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
