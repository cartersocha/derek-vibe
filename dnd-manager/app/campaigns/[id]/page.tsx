import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteCampaign } from '@/lib/actions/campaigns'
import { DeleteCampaignButton } from '@/components/ui/delete-campaign-button'
import {
  extractPlayerSummaries,
  dateStringToLocalDate,
  formatDateStringForDisplay,
  formatTimestampForDisplay,
  type SessionCharacterRelation,
} from '@/lib/utils'
import { SessionParticipantPills } from '@/components/ui/session-participant-pills'

type SessionRow = {
  id: string
  name: string
  notes: string | null
  session_date: string | null
  created_at: string | null
  session_characters: SessionCharacterRelation[] | null
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (!campaign) {
    notFound()
  }

  // Fetch sessions for this campaign
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
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
    .eq('campaign_id', id)
    .order('session_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .returns<SessionRow[]>()

  const sessionNumberMap = new Map<string, number>()

  const rawSessions = sessions ?? []

  if (rawSessions.length > 0) {
    const ordered = [...rawSessions].sort((a, b) => {
      const aDate = dateStringToLocalDate(a.session_date)
      const bDate = dateStringToLocalDate(b.session_date)
      const aTime = aDate ? aDate.getTime() : Number.POSITIVE_INFINITY
      const bTime = bDate ? bDate.getTime() : Number.POSITIVE_INFINITY
      if (aTime === bTime) {
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
        return aCreated - bCreated
      }
      return aTime - bTime
    })

    let counter = 1
    for (const session of ordered) {
      if (!session.session_date) {
        continue
      }
      sessionNumberMap.set(session.id, counter)
      counter += 1
    }
  }

  const sessionsWithPlayers = rawSessions.map((session) => {
    const players = extractPlayerSummaries(session.session_characters)

    return {
      ...session,
      players,
    }
  })

  const deleteCampaignWithId = deleteCampaign.bind(null, id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/campaigns" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Campaigns
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={`/campaigns/${id}/edit`}
            className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            Edit Campaign
          </Link>
          <form action={deleteCampaignWithId}>
            <DeleteCampaignButton />
          </form>
        </div>
      </div>

      <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8 space-y-8">
        {/* Campaign Name and Description */}
        <div>
          <h1 className="text-4xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">{campaign.name}</h1>
          {campaign.description && (
            <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-6">
              <p className="text-gray-300 whitespace-pre-wrap font-mono">{campaign.description}</p>
            </div>
          )}
        </div>

        {/* Campaign Stats */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Sessions</div>
            <div className="text-3xl font-bold text-[#00ffff]">{rawSessions.length}</div>
          </div>
          <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Created</div>
            <div className="text-lg font-bold text-[#00ffff]">
              {formatTimestampForDisplay(
                campaign.created_at,
                'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' }
              ) ?? 'Unknown'}
            </div>
          </div>
          <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last Updated</div>
            <div className="text-lg font-bold text-[#00ffff]">
              {formatTimestampForDisplay(
                campaign.updated_at,
                'en-US',
                { month: 'short', day: 'numeric', year: 'numeric' }
              ) ?? 'Unknown'}
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Sessions</h2>
            <Link
              href={`/sessions/new?campaign_id=${id}`}
              className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 text-sm shadow-lg shadow-[#ff00ff]/50 text-center"
            >
              + Add Session
            </Link>
          </div>

          {rawSessions.length === 0 ? (
            <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-8 text-center">
              <p className="text-gray-400 font-mono mb-4">No sessions yet for this campaign</p>
              <Link
                href={`/sessions/new?campaign_id=${id}`}
                className="inline-block w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
              >
                Create First Session
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionsWithPlayers.map((session) => {
                const players = session.players

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
                      <div className="relative z-10 flex-1 pointer-events-none">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-xl font-bold text-[#00ffff] uppercase tracking-wider transition-colors group-hover:text-[#ff00ff]">
                            {session.name}
                          </span>
                          {sessionNumberMap.has(session.id) && (
                            <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[#ff00ff]">
                              Session #{sessionNumberMap.get(session.id)}
                            </span>
                          )}
                        </div>
                        {session.notes && (
                          <p className="text-sm text-gray-400 line-clamp-2 font-mono">
                            {session.notes}
                          </p>
                        )}
                        {players.length > 0 && (
                          <SessionParticipantPills
                            sessionId={session.id}
                            players={players}
                            className="mt-3 pointer-events-auto"
                          />
                        )}
                      </div>
                      <div className="relative z-10 pointer-events-none text-xs text-gray-500 font-mono uppercase tracking-wider sm:ml-4 sm:text-right">
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
          )}
        </div>
      </div>
    </div>
  )
}
