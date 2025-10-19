import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteCharacter, updateCharacterSessions } from '@/lib/actions/characters'
import { DeleteCharacterButton } from '@/components/ui/delete-character-button'
import MultiSelectDropdown from '@/components/ui/multi-select-dropdown'
import {
  extractPlayerSummaries,
  dateStringToLocalDate,
  formatDateStringForDisplay,
  type PlayerSummary,
  type SessionCharacterRelation,
} from '@/lib/utils'
import { renderNotesWithMentions, type MentionTarget } from '@/lib/mention-utils'
import { SessionParticipantPills } from '@/components/ui/session-participant-pills'

type SessionSummary = {
  id: string
  name: string
  session_date: string | null
  notes: string | null
  created_at: string | null
  campaign_id: string | null
  campaign: {
    id: string
    name: string
  } | null
  players: PlayerSummary[]
}

type SessionRow = {
  id: string
  name: string
  session_date: string | null
  notes: string | null
  created_at: string | null
  campaign_id: string | null
  campaign: { id: string; name: string } | { id: string; name: string }[] | null
  session_characters: SessionCharacterRelation[] | null
}

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (!character) {
    notFound()
  }

  const [{ data: mentionCharacters }, { data: organizationLinks }, { data: allOrganizations }] = await Promise.all([
    supabase
      .from('characters')
      .select('id, name'),
    supabase
      .from('organization_characters')
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name
        )
      `)
      .eq('character_id', id),
    supabase
      .from('organizations')
      .select('id, name'),
  ])

  const playerTypeLabel = character.player_type === 'player' ? 'Player' : 'NPC'
  const statusLabel = (() => {
    switch (character.status) {
      case 'dead':
        return 'Dead'
      case 'unknown':
        return 'Unknown'
      case 'alive':
      default:
        return 'Alive'
    }
  })()
  const locationLabel = character.last_known_location || 'Unknown'
  const levelLabel = character.player_type === 'player' ? 'Level' : 'Challenge Rating'
  const levelValue = character.level || '—'

  const formatRoleLabel = (role: string | null | undefined) => {
    if (!role) {
      return null
    }
    if (role === 'npc') {
      return 'NPC'
    }
    if (role === 'player') {
      return 'Player'
    }

    return role
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
  }

  const organizationAffiliationMap = new Map<string, { id: string; name: string; role: string | null; roleLabel: string | null }>()

  for (const link of organizationLinks ?? []) {
    const organization = Array.isArray(link.organizations)
      ? link.organizations[0]
      : link.organizations

    const orgId = organization?.id ?? link.organization_id
    if (!orgId) {
      continue
    }

    if (organizationAffiliationMap.has(orgId)) {
      continue
    }

    organizationAffiliationMap.set(orgId, {
      id: orgId,
      name: organization?.name ?? 'Untitled Organization',
      role: link.role ?? null,
      roleLabel: formatRoleLabel(link.role),
    })
  }

  const organizationAffiliations = Array.from(organizationAffiliationMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  const organizationSummary = organizationAffiliations.length > 0
    ? organizationAffiliations.map((affiliation) => affiliation.name).join(', ')
    : 'None'

  // Get sessions this character was in
  const { data: sessionCharacters } = await supabase
    .from('session_characters')
    .select('session_id')
    .eq('character_id', id)

  const sessionIds = sessionCharacters?.map(sc => sc.session_id) || []
  const linkedSessionIds = new Set(sessionIds)

  const { data: allSessionsData } = await supabase
    .from('sessions')
    .select(`
      id,
      name,
      session_date,
      notes,
      created_at,
      campaign_id,
      campaign:campaigns(id, name),
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
    .order('session_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .returns<SessionRow[]>()

  const allSessions: SessionSummary[] = (allSessionsData || []).map((session) => {
    const campaign = Array.isArray(session.campaign)
      ? session.campaign[0] ?? null
      : session.campaign ?? null

    const players = extractPlayerSummaries(session.session_characters)

    return {
      id: session.id,
      name: session.name,
      session_date: session.session_date,
      notes: session.notes ?? null,
      created_at: session.created_at,
      campaign_id: session.campaign_id,
      campaign,
      players,
    }
  })
  const linkedSessions = allSessions.filter(session => linkedSessionIds.has(session.id))

  const sessionNumberMap = new Map<string, number>()

  if (linkedSessions.length > 0) {
    const campaignIds = Array.from(new Set(
      linkedSessions
        .map((session) => session.campaign_id)
        .filter((campaignId): campaignId is string => Boolean(campaignId))
    ))

    if (campaignIds.length > 0) {
      const campaignIdSet = new Set(campaignIds)
      const sessionsByCampaign = allSessions.reduce<Map<string, SessionSummary[]>>((acc, session) => {
        if (!session.campaign_id || !campaignIdSet.has(session.campaign_id)) {
          return acc
        }

        const existing = acc.get(session.campaign_id)
        if (existing) {
          existing.push(session)
        } else {
          acc.set(session.campaign_id, [session])
        }
        return acc
      }, new Map())

      sessionsByCampaign.forEach((sessions) => {
        const sorted = sessions
          .filter((session) => Boolean(session.session_date))
          .sort((a, b) => {
            if (a.session_date && b.session_date) {
              const aDate = dateStringToLocalDate(a.session_date)
              const bDate = dateStringToLocalDate(b.session_date)
              if (aDate && bDate) {
                const dateCompare = aDate.getTime() - bDate.getTime()
                if (dateCompare !== 0) {
                  return dateCompare
                }
              }
            }

            const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
            const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
            return aCreated - bCreated
          })

        let counter = 1
        for (const session of sorted) {
          sessionNumberMap.set(session.id, counter)
          counter += 1
        }
      })
    }
  }

  const characterMentionTargets: MentionTarget[] = (mentionCharacters ?? []).map((entry) => ({
    id: entry.id,
    name: entry.name,
    href: `/characters/${entry.id}`,
    kind: 'character' as const,
  }))

  const sessionMentionTargets: MentionTarget[] = allSessions.map((session) => ({
    id: session.id,
    name: session.name,
    href: `/sessions/${session.id}`,
    kind: 'session' as const,
  }))

  const organizationMentionTargets: MentionTarget[] = (allOrganizations ?? [])
    .filter((entry): entry is { id: string; name: string } => Boolean(entry?.name))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      href: `/organizations/${entry.id}`,
      kind: 'organization' as const,
    }))

  const mentionTargets: MentionTarget[] = [
    ...characterMentionTargets,
    ...sessionMentionTargets,
    ...organizationMentionTargets,
  ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  const deleteCharacterWithId = deleteCharacter.bind(null, id)
  const updateCharacterSessionsWithId = updateCharacterSessions.bind(null, id)

  const dropdownOptions = allSessions.map((session) => ({
    id: session.id,
    label: session.name,
    subLabel: session.session_date
      ? formatDateStringForDisplay(session.session_date)
      : null,
    checked: linkedSessionIds.has(session.id),
  }))

  async function handleSessionUpdate(selectedIds: string[]) {
    'use server'
    const formData = new FormData()
    const uniqueSelections = Array.from(new Set(selectedIds)).filter(Boolean)
    uniqueSelections.forEach((sessionId) => formData.append('session_ids', sessionId))
    await updateCharacterSessionsWithId(formData)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/characters" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Characters
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={`/characters/${id}/edit`}
            className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            Edit Character
          </Link>
          <form action={deleteCharacterWithId}>
            <DeleteCharacterButton />
          </form>
        </div>
      </div>

      <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8 space-y-6">
        <header>
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest text-[#e8faff] drop-shadow-[0_0_8px_rgba(0,255,255,0.35)]">
            {character.name}
          </h1>
        </header>

        <div className="md:flow-root space-y-6 md:space-y-0">
          {/* Infobox floats right just like the reference layout */}
          <aside className="md:float-right md:w-72 md:ml-8 md:mb-4 w-full max-w-xs rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-lg shadow-[#00ffff]/20 font-mono text-sm text-gray-200">
            <div className="p-4 space-y-4">
              {character.image_url && (
                <div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded border border-[#00ffff] border-opacity-30 bg-black">
                    <Image
                      src={character.image_url}
                      alt={character.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="mt-2 text-center text-xs uppercase tracking-widest text-gray-400">{character.name || 'Unknown'}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h2 className="text-[#00ffff] text-base font-semibold uppercase tracking-wider">Character Details</h2>
                </div>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">Type</dt>
                    <dd className="text-right text-[#f0f0ff]">{playerTypeLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">Status</dt>
                    <dd className="text-right text-[#f0f0ff]">{statusLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">Race</dt>
                    <dd className="text-right text-[#f0f0ff]">{character.race || 'Unknown'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">Class</dt>
                    <dd className="text-right text-[#f0f0ff]">{character.class || 'Untrained'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">{levelLabel}</dt>
                    <dd className="text-right text-[#f0f0ff]">{levelValue}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">Last Seen</dt>
                    <dd className="text-right text-[#f0f0ff]">{locationLabel}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>

          <section className="mb-6 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Affiliations</h3>
            </div>
            {organizationAffiliations.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {organizationAffiliations.map((affiliation) => (
                  <Link
                    key={affiliation.id}
                    href={`/organizations/${affiliation.id}`}
                    className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-4 py-2 text-xs sm:text-sm uppercase tracking-widest text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd447]"
                  >
                    <span className="font-semibold">{affiliation.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm font-mono uppercase tracking-wider text-gray-500">No organization affiliations yet.</p>
            )}
          </section>

          {/* Backstory text now wraps around the infobox */}
          <section className="text-gray-300 font-mono leading-relaxed space-y-4 text-base sm:text-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Backstory & Notes</h3>
            </div>
            {character.backstory ? (
              <div className="whitespace-pre-wrap leading-relaxed">
                {renderNotesWithMentions(character.backstory, mentionTargets)}
              </div>
            ) : (
              <p className="text-gray-500 italic">No backstory provided yet.</p>
            )}
          </section>

          <div className="clear-both" />
        </div>

        {/* Sessions */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Sessions</h3>
            {allSessions.length > 0 ? (
              /* Dropdown control to link/unlink sessions without large inline form */
              <MultiSelectDropdown
                label="Manage Sessions"
                options={dropdownOptions}
                onSubmit={handleSessionUpdate}
                emptyMessage="No sessions available"
                submitLabel="Save Sessions"
                className="md:w-60 w-full md:shrink-0"
                menuWidthClass="w-60"
              />
            ) : (
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider md:text-right">Create a session to link it.</p>
            )}
          </div>

          {linkedSessions.length > 0 ? (
            <div className="space-y-3">
              {linkedSessions.map((session) => {
                const players = session.players
                const sessionNumber = sessionNumberMap.get(session.id)
                const campaignRelation = session.campaign
                const sessionDateLabel = formatDateStringForDisplay(session.session_date)
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
                          {sessionNumber !== undefined && sessionNumber !== null && (
                            <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[#ff00ff]">
                              Session #{sessionNumber}
                            </span>
                          )}
                        </div>
                        {campaignRelation?.id && campaignRelation.name && (
                          <Link
                            href={`/campaigns/${campaignRelation.id}`}
                            className="pointer-events-auto inline-flex text-xs font-mono uppercase tracking-widest text-[#ff00ff] transition-colors hover:text-[#ff6ad5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6ad5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                          >
                            Campaign: {campaignRelation.name}
                          </Link>
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
                        {sessionDateLabel ? <div>{sessionDateLabel}</div> : <div>No date set</div>}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 font-mono italic">No related sessions yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
