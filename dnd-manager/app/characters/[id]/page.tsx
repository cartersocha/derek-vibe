import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteCharacter, updateCharacterSessions } from '@/lib/actions/characters'
import { DeleteCharacterButton } from '@/components/ui/delete-character-button'
import MultiSelectDropdown from '@/components/ui/multi-select-dropdown'
import {
  cn,
  extractPlayerSummaries,
  type PlayerSummary,
  type SessionCharacterRelation,
} from '@/lib/utils'
import { renderNotesWithMentions, type MentionTarget } from '@/lib/mention-utils'

type SessionSummary = {
  id: string
  name: string
  session_date: string | null
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

  const playerTypeLabel = character.player_type === 'player' ? 'Player Character' : 'NPC'
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
      campaign:campaigns(id, name),
      session_characters:session_characters(
        character:characters(id, name, class, race, level, player_type)
      )
    `)
    .order('session_date', { ascending: false })
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
      campaign,
      players,
    }
  })
  const linkedSessions = allSessions.filter(session => linkedSessionIds.has(session.id))

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
      ? new Date(session.session_date).toLocaleDateString()
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
                  <div>
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">Organizations</dt>
                    <dd className="mt-1 text-right text-[#f0f0ff] text-xs leading-snug">{organizationSummary}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>

          {/* Backstory text now wraps around the infobox */}
          <section className="text-gray-300 font-mono leading-relaxed space-y-4 text-base sm:text-lg">
            <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Backstory & Notes</h3>
            {character.backstory ? (
              <div className="whitespace-pre-wrap leading-relaxed">
                {renderNotesWithMentions(character.backstory, mentionTargets)}
              </div>
            ) : (
              <p className="text-gray-500 italic">No backstory provided yet.</p>
            )}
          </section>

          <section className="space-y-3 font-mono text-gray-300">
            <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Organization Affiliations</h3>
            {organizationAffiliations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {organizationAffiliations.map((affiliation) => (
                  <Link
                    key={affiliation.id}
                    href={`/organizations/${affiliation.id}`}
                    className="group inline-flex items-center gap-2 rounded border border-[#00ffff]/30 bg-[#0f0f23] px-3 py-1 text-[11px] uppercase tracking-widest text-[#00ffff] transition hover:border-[#ff00ff] hover:text-[#ff00ff]"
                  >
                    <span>{affiliation.name}</span>
                    {affiliation.roleLabel ? (
                      <span className="text-[9px] font-bold text-[#ff00ff] transition group-hover:text-[#ff6ad5]">
                        {affiliation.roleLabel}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No organization affiliations yet.</p>
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

                return (
                  <article
                    key={session.id}
                    className="group p-4 border border-[#00ffff] border-opacity-20 rounded transition-all duration-200 hover:border-[#ff00ff] hover:bg-[#0f0f23]"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link
                          href={`/sessions/${session.id}`}
                          className="font-medium text-[#00ffff] font-mono text-lg transition-colors hover:text-[#ff00ff] focus:text-[#ff00ff] focus:outline-none pb-1"
                        >
                          {session.name}
                        </Link>
                        {session.campaign?.name && (
                          <span className="mt-1 block text-xs uppercase tracking-wider text-[#ff00ff] font-semibold">
                            {session.campaign.name}
                          </span>
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
                      <div className="flex flex-col gap-2 text-sm text-gray-400 font-mono uppercase tracking-wider text-right">
                        {session.session_date ? (
                          <span>{new Date(session.session_date).toLocaleDateString()}</span>
                        ) : (
                          <span>No date set</span>
                        )}
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
          ) : (
            <p className="text-gray-500 font-mono italic">No related sessions yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
