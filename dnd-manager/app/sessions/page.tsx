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

  const sessionNumberMap = new Map<string, number>()

  if (sessions) {
    // Group sessions by campaign so we can assign per-campaign sequence numbers
    type SessionWithCampaign = typeof sessions extends (infer S)[] ? S : never
    const sessionsByCampaign = new Map<string, SessionWithCampaign[]>()

    for (const session of sessions) {
      if (!session.campaign_id) {
        continue
      }
      const bucket = sessionsByCampaign.get(session.campaign_id) ?? []
      bucket.push(session)
      sessionsByCampaign.set(session.campaign_id, bucket)
    }

    for (const [, campaignSessions] of sessionsByCampaign) {
      campaignSessions.sort((a, b) => {
        const aDate = a.session_date ? new Date(a.session_date).getTime() : Number.POSITIVE_INFINITY
        const bDate = b.session_date ? new Date(b.session_date).getTime() : Number.POSITIVE_INFINITY
        if (aDate === bDate) {
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
          return aCreated - bCreated
        }
        return aDate - bDate
      })

      let counter = 1
      for (const campaignSession of campaignSessions) {
        if (!campaignSession.session_date) {
          continue
        }
        sessionNumberMap.set(campaignSession.id, counter)
        counter += 1
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Sessions</h1>
        <Link
          href="/sessions/new"
          className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
        >
          + New Session
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-12 text-center">
          <h3 className="text-lg font-medium text-[#00ffff] mb-2 uppercase tracking-wider">No sessions yet</h3>
          <p className="text-gray-400 mb-6 font-mono">Create your first session to get started</p>
          <Link
            href="/sessions/new"
            className="inline-block w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
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
              className="block bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50 transition-all duration-200 group"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider group-hover:text-[#ff00ff] transition-colors">
                      {session.name}
                    </h3>
                    {sessionNumberMap.has(session.id) && (
                      <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[#ff00ff]">
                        Session #{sessionNumberMap.get(session.id)}
                      </span>
                    )}
                  </div>
                  {session.campaign && (
                    <p className="text-sm text-[#ff00ff] mb-2 font-mono">
                      Campaign: {session.campaign.name}
                    </p>
                  )}
                  {session.notes && (
                    <p className="text-gray-400 line-clamp-2 font-mono text-sm">{session.notes}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 font-mono uppercase tracking-wider sm:text-right sm:ml-4">
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
