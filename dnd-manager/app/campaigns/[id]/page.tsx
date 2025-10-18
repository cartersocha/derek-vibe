import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteCampaign } from '@/lib/actions/campaigns'
import { DeleteCampaignButton } from '@/components/ui/delete-campaign-button'
import {
  cn,
  extractPlayerSummaries,
  type SessionCharacterRelation,
} from '@/lib/utils'

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
        character:characters(id, name, class, race, level, player_type)
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
              {new Date(campaign.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
          <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last Updated</div>
            <div className="text-lg font-bold text-[#00ffff]">
              {new Date(campaign.updated_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
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
                    className="group p-4 border border-[#00ffff] border-opacity-20 rounded transition-all duration-200 hover:border-[#ff00ff] hover:bg-[#0f0f23]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link
                            href={`/sessions/${session.id}`}
                            className="font-medium text-[#00ffff] font-mono transition-colors hover:text-[#ff00ff] focus:text-[#ff00ff] focus:outline-none"
                          >
                            {session.name}
                          </Link>
                          {sessionNumberMap.has(session.id) && (
                            <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[#ff00ff]">
                              Session #{sessionNumberMap.get(session.id)}
                            </span>
                          )}
                        </div>
                        {session.notes && (
                          <p className="text-sm text-gray-400 line-clamp-2 font-mono">{session.notes}</p>
                        )}
                        {players.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2" aria-label="Players present">
                            {players.map((player) => (
                              <Link
                                key={`${session.id}-${player.id}`}
                                href={`/characters/${player.id}`}
                                className={cn(
                                  'rounded px-2 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2',
                                  player.player_type === 'player'
                                    ? 'border border-[#00ffff] border-opacity-40 bg-[#0f0f23] text-[#00ffff] hover:border-[#00ffff] hover:text-[#ff00ff] focus-visible:ring-[#00ffff]'
                                    : 'border border-[#ff00ff] border-opacity-40 bg-[#211027] text-[#ff6ad5] hover:border-[#ff6ad5] hover:text-[#ff9de6] focus-visible:ring-[#ff00ff]'
                                )}
                              >
                                {player.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start sm:items-end sm:ml-4 gap-2 text-sm text-gray-400 font-mono uppercase tracking-wider">
                        {session.session_date ? (
                          <span>
                            {new Date(session.session_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        ) : null}
                        <Link
                          href={`/sessions/${session.id}`}
                          className="text-[#ff00ff] text-[10px] font-bold uppercase tracking-widest hover:text-[#ff6ad5] focus:text-[#ff6ad5] focus:outline-none"
                        >
                          View session →
                        </Link>
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
