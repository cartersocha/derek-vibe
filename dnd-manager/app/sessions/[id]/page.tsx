import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteSession } from '@/lib/actions/sessions'
import { DeleteSessionButton } from '@/components/ui/delete-session-button'
import { renderNotesWithMentions, type MentionTarget } from '@/lib/mention-utils'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      campaign:campaigns(id, name)
    `)
    .eq('id', id)
    .single()

  if (!session) {
    notFound()
  }

  const sessionNumberMap = new Map<string, number>()

  if (session.campaign_id) {
    const { data: sessionsForCampaign } = await supabase
      .from('sessions')
      .select('id, name, session_date')
      .eq('campaign_id', session.campaign_id)
      .order('session_date', { ascending: true, nullsFirst: true })

    if (sessionsForCampaign) {
      let counter = 1
      for (const campaignSession of sessionsForCampaign) {
        if (campaignSession.session_date) {
          sessionNumberMap.set(campaignSession.id, counter)
          counter += 1
        }
      }
    }
  }

  // Fetch characters for this session
  const { data: sessionCharacters } = await supabase
    .from('session_characters')
    .select('character_id')
    .eq('session_id', id)

  const characterIds = sessionCharacters?.map(sc => sc.character_id) || []
  
  type SessionCharacterRow = {
    id: string
    name: string
    level: string | null
    player_type: 'npc' | 'player' | null
    organization_memberships: Array<{
      organizations:
        | { id: string | null; name: string | null }
        | Array<{ id: string | null; name: string | null }>
    }> | null
  }

  let sessionChars: Array<{
    id: string
    name: string
    level: string | null
    player_type: 'npc' | 'player' | null
    organizations: { id: string; name: string }[]
  }> = []

  if (characterIds.length > 0) {
    const { data: charData } = await supabase
      .from('characters')
      .select(
        `
          id,
          name,
          level,
          player_type,
          organization_memberships:organization_characters(
            organizations(id, name)
          )
        `
      )
      .in('id', characterIds)

    sessionChars = (charData as SessionCharacterRow[] | null)?.map((character) => {
      const organizations: { id: string; name: string }[] = Array.isArray(character.organization_memberships)
        ? character.organization_memberships
            .map((membership) => {
              const orgData = membership.organizations
              const organization = Array.isArray(orgData) ? orgData[0] : orgData
              if (!organization?.id || !organization?.name) {
                return null
              }
              return {
                id: organization.id,
                name: organization.name,
              }
            })
            .filter((entry): entry is { id: string; name: string } => Boolean(entry))
        : []

      return {
        id: character.id,
        name: character.name,
        level: character.level,
        player_type: character.player_type,
        organizations,
      }
    }) ?? []
  }

  const [{ data: mentionCharacters }, { data: mentionSessions }, { data: mentionOrganizations }] = await Promise.all([
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
  ])

  const mentionTargets = (() => {
    const map = new Map<string, MentionTarget>()

    const addTarget = (target: MentionTarget) => {
      if (!target.id || !target.name) {
        return
      }
      map.set(`${target.kind}:${target.id}`, target)
    }

    for (const character of mentionCharacters ?? []) {
      if (!character?.id || !character?.name) {
        continue
      }
      addTarget({
        id: character.id,
        name: character.name,
        href: `/characters/${character.id}`,
        kind: 'character',
      })
    }

    for (const sessionEntry of mentionSessions ?? []) {
      if (!sessionEntry?.id || !sessionEntry?.name) {
        continue
      }
      addTarget({
        id: sessionEntry.id,
        name: sessionEntry.name,
        href: `/sessions/${sessionEntry.id}`,
        kind: 'session',
      })
    }

    for (const organization of mentionOrganizations ?? []) {
      if (!organization?.id || !organization?.name) {
        continue
      }
      addTarget({
        id: organization.id,
        name: organization.name,
        href: `/organizations/${organization.id}`,
        kind: 'organization',
      })
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  })()

  const deleteSessionWithId = deleteSession.bind(null, id)

  const campaignSessionNumber = sessionNumberMap.get(session.id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/sessions" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Sessions
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={`/sessions/${id}/edit`}
            className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            Edit Session
          </Link>
          <form action={deleteSessionWithId}>
            <DeleteSessionButton />
          </form>
        </div>
      </div>

      <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8 space-y-8">
        {/* Header Image */}
        {session.header_image_url && (
          <div className="relative w-full h-48 sm:h-64 rounded border-2 border-[#00ffff] border-opacity-30 overflow-hidden bg-[#0f0f23]">
            <Image
              src={session.header_image_url}
              alt={session.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Session Name and Info */}
        <div>
          <h1 className="text-4xl font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            {session.name}
            {campaignSessionNumber !== undefined && (
              <span className="ml-3 text-base font-mono uppercase tracking-widest text-[#ff00ff]">
                Session #{campaignSessionNumber}
              </span>
            )}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm">
            {session.campaign && (
              <Link 
                href={`/campaigns/${session.campaign.id}`}
                className="text-[#ff00ff] hover:text-[#cc00cc] font-mono uppercase tracking-wider"
              >
                Campaign: {session.campaign.name}
              </Link>
            )}
            {session.session_date && (
              <span className="text-gray-400 font-mono uppercase tracking-wider">
                Date: {new Date(session.session_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            )}
          </div>
        </div>

        {/* Session Notes */}
        {session.notes && (
          <div>
            <h3 className="text-xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Session Notes</h3>
            <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-6">
              <div className="text-gray-300 whitespace-pre-wrap font-mono text-base sm:text-lg leading-relaxed break-words">
                {renderNotesWithMentions(session.notes, mentionTargets)}
              </div>
            </div>
          </div>
        )}

        {/* Characters Present */}
        {sessionChars.length > 0 && (
          (() => {
            const sortedCharacters = [...sessionChars].sort((a, b) => {
              const weight = (value: typeof a.player_type) => (value === 'player' ? 0 : value === 'npc' ? 1 : 2)
              const weightDiff = weight(a.player_type) - weight(b.player_type)
              if (weightDiff !== 0) {
                return weightDiff
              }
              return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            })

            return (
              <div>
                <h3 className="text-xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Related Characters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {sortedCharacters.map((character) => {
                const isPlayer = character.player_type === 'player'
                const badgeClasses = isPlayer
                  ? 'border border-[#00ffff] border-opacity-40 bg-[#0f0f23] text-[#00ffff] group-hover:border-[#00ffff] group-hover:text-[#ff00ff]'
                  : 'border border-[#ff00ff] border-opacity-40 bg-[#211027] text-[#ff6ad5] group-hover:border-[#ff6ad5] group-hover:text-[#ff9de6]'
                const levelLabel = character.level
                  ? isPlayer
                    ? `Level ${character.level}`
                    : `CR ${character.level}`
                  : null

                return (
                  <div
                    key={character.id}
                    className="group p-3 border border-[#00ffff] border-opacity-20 rounded hover:border-[#ff00ff] hover:bg-[#0f0f23] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/characters/${character.id}`}
                        className="font-medium text-[#00ffff] font-mono text-sm sm:text-base transition-colors group-hover:text-[#ff00ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]"
                      >
                        {character.name}
                      </Link>
                      {character.player_type ? (
                        <span className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${badgeClasses}`}>
                          {isPlayer ? 'Player' : 'NPC'}
                        </span>
                      ) : null}
                    </div>
                    {levelLabel ? (
                      <p className="mt-2 text-[11px] text-gray-400 font-mono uppercase tracking-wider">
                        {levelLabel}
                      </p>
                    ) : null}
                    {character.organizations.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {character.organizations.map((organization) => (
                          <Link
                            key={`${character.id}-${organization.id}`}
                            href={`/organizations/${organization.id}`}
                            className="inline-flex items-center rounded border border-[#00ffff]/30 bg-[#0f0f23] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[#00ffff] transition-colors hover:border-[#ff00ff] hover:text-[#ff00ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff]"
                          >
                            {organization.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
                  })}
                </div>
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}
