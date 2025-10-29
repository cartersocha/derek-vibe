import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteCharacter } from '@/lib/actions/characters'
import { DeleteCharacterButton } from '@/components/ui/delete-character-button'
import SessionManager from '@/components/ui/session-manager'
import EditIcon from '@/components/ui/edit-icon'
import {
  extractPlayerSummaries,
  dateStringToLocalDate,
  formatDateStringForDisplay,
  type SessionCharacterRelation,
  getPillClasses,
  cn,
} from '@/lib/utils'
import { renderNotesWithMentions, type MentionTarget } from '@/lib/mention-utils'
import { CharacterSessionCard } from '@/components/ui/character-session-card'
import type { SessionRow, SessionSummary } from '@/lib/types/sessions'

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

  const [{ data: mentionCharacters }, { data: groupLinks }, { data: allGroups }] = await Promise.all([
    supabase
      .from('characters')
      .select('id, name'),
    supabase
      .from('group_characters')
      .select(`
        group_id,
        role,
        groups (
          id,
          name
        )
      `)
      .eq('character_id', id),
    supabase
      .from('groups')
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

  const groupAffiliationMap = new Map<string, { id: string; name: string; role: string | null; roleLabel: string | null }>()

  for (const link of groupLinks ?? []) {
    const group = Array.isArray(link.groups)
      ? link.groups[0]
      : link.groups

    const orgId = group?.id ?? link.group_id
    if (!orgId) {
      continue
    }

    if (groupAffiliationMap.has(orgId)) {
      continue
    }

    groupAffiliationMap.set(orgId, {
      id: orgId,
      name: group?.name ?? 'Untitled Group',
      role: link.role ?? null,
      roleLabel: formatRoleLabel(link.role),
    })
  }

  const groupAffiliations = Array.from(groupAffiliationMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  // Get sessions this character was in
  const { data: sessionCharacters } = await supabase
    .from('session_characters')
    .select('session_id')
    .eq('character_id', id)

  const sessionIds = sessionCharacters?.map(sc => sc.session_id) || []
  const linkedSessionIds = new Set(sessionIds)
  

  const { data: allSessionsData, error: sessionsError } = await supabase
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
          group_memberships:group_characters(
            groups(id, name)
          )
        )
      ),
      session_groups:group_sessions(
        group:groups(id, name)
      )
    `)
    .order('session_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .returns<SessionRow[]>()

  if (sessionsError) {
    throw new Error(sessionsError.message)
  }

  const allSessions: SessionSummary[] = (allSessionsData ?? []).map((session) => {
    // Handle campaign data - only available in full SessionRow, not in basic sessions
    const campaign = 'campaign' in session ? (
      Array.isArray(session.campaign)
        ? session.campaign[0] ?? null
        : session.campaign ?? null
    ) : null

    // Handle players data - only available in full SessionRow
    const players = 'session_characters' in session && session.session_characters 
      ? extractPlayerSummaries(session.session_characters as SessionCharacterRelation[]) 
      : []
    
    // Handle groups data - only available in full SessionRow
    const groups = 'session_groups' in session && session.session_groups
      ? (session.session_groups as Array<{
          group:
            | { id: string | null; name: string | null }
            | { id: string | null; name: string | null }[]
            | null
        }>)
          .map((link) => {
            const group = Array.isArray(link.group)
              ? link.group[0]
              : link.group
            return group
          })
          .filter((org): org is { id: string; name: string } => 
            Boolean(org?.id && org?.name)
          )
      : []

    return {
      id: session.id,
      name: session.name,
      session_date: session.session_date,
      notes: session.notes ?? null,
      created_at: session.created_at,
      campaign_id: session.campaign_id,
      campaign,
      players,
      groups,
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

  const groupMentionTargets: MentionTarget[] = (allGroups ?? [])
    .flatMap((entry) => {
      if (!entry?.id || !entry?.name) {
        return []
      }
      return [{
        id: entry.id as string,
        name: entry.name as string,
        href: `/groups/${entry.id}`,
        kind: 'group' as const,
      }]
    })

  const mentionTargets: MentionTarget[] = [
    ...characterMentionTargets,
    ...sessionMentionTargets,
    ...groupMentionTargets,
  ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  const deleteCharacterWithId = deleteCharacter.bind(null, id)
  const dropdownOptions = allSessions.map((session) => ({
    id: session.id,
    label: session.name,
    subLabel: session.session_date
      ? formatDateStringForDisplay(session.session_date)
      : null,
    checked: linkedSessionIds.has(session.id),
  }))


  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl pt-4 px-8 pb-8 space-y-6">
        <div className="flex flex-row flex-wrap items-center gap-3 justify-between">
          <Link href="/characters" className="text-[var(--cyber-cyan)] hover-cyber font-mono uppercase tracking-wider">
            ← Back to Characters
          </Link>
          <div className="flex flex-row flex-wrap items-center gap-2 ml-auto">
            <Link
              href={`/characters/${id}/edit`}
              className="inline-flex self-start w-auto h-10 bg-[var(--cyber-magenta)] text-black px-4 text-sm sm:text-base rounded font-bold uppercase tracking-wider hover-brightness transition-all duration-200 shadow-lg shadow-[var(--cyber-magenta)]/50 text-center items-center justify-center"
            >
              <EditIcon size="sm" className="bg-black" />
            </Link>
            <form action={deleteCharacterWithId}>
              <DeleteCharacterButton />
            </form>
          </div>
        </div>
        
        <header className="-mt-2">
          <h1 className="retro-title text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-widest text-[var(--text-primary)] drop-shadow-[0_0_8px_rgba(0,255,255,0.35)] break-words">
            {character.name}
          </h1>
        </header>


        <div className="md:flow-root space-y-6 md:space-y-0">
          {/* Infobox floats right just like the reference layout */}
          <aside className="md:float-right md:w-72 md:ml-8 md:mb-4 w-full max-w-xs rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-[var(--bg-dark)] shadow-lg shadow-[var(--cyber-cyan)]/20 font-mono text-sm text-[var(--text-primary)]">
            <div className="p-4 space-y-4">
              {character.image_url && (
                <div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-black">
                    <Image
                      src={character.image_url}
                      alt={character.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="mt-2 text-center text-xs uppercase tracking-widest text-[var(--text-secondary)]">{character.name || 'Unknown'}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h2 className="text-[var(--cyber-cyan)] text-base font-semibold uppercase tracking-wider">Character Details</h2>
                </div>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-secondary)] uppercase tracking-widest text-[10px]">Type</dt>
                    <dd className="text-right text-[var(--text-primary)]">{playerTypeLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-secondary)] uppercase tracking-widest text-[10px]">Status</dt>
                    <dd className="text-right text-[var(--text-primary)]">{statusLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-secondary)] uppercase tracking-widest text-[10px]">Race</dt>
                    <dd className="text-right text-[var(--text-primary)]">{character.race || 'Unknown'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-secondary)] uppercase tracking-widest text-[10px]">Class</dt>
                    <dd className="text-right text-[var(--text-primary)]">{character.class || 'Untrained'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-secondary)] uppercase tracking-widest text-[10px]">{levelLabel}</dt>
                    <dd className="text-right text-[var(--text-primary)]">{levelValue}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--text-secondary)] uppercase tracking-widest text-[10px]">Last Seen</dt>
                    <dd className="text-right text-[var(--text-primary)]">{locationLabel}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>


          {/* Backstory text now wraps around the infobox */}
          <section className="text-[var(--gray-300)] font-mono leading-relaxed space-y-4 text-base sm:text-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <h3 className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">Backstory & Notes</h3>
            </div>
            {character.backstory ? (
              <div className="whitespace-pre-wrap leading-relaxed dynamic-text">
                {renderNotesWithMentions(character.backstory, mentionTargets)}
              </div>
            ) : (
              <p className="text-[var(--gray-500)] italic">No backstory provided yet.</p>
            )}
          </section>

          <div className="clear-both" />
        </div>

        {/* Campaigns and Affiliations Section - Dynamic Width */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
          {/* Campaigns Section */}
          <section className="space-y-4 flex-shrink-0" style={{ 
            width: linkedSessions.length > 0 ? 
              `${Math.max(200, Math.min(400, linkedSessions.length * 80))}px` : 
              '200px'
          }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h3 className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">Campaigns</h3>
            </div>
            {linkedSessions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const campaigns = linkedSessions
                    .map(session => session.campaign)
                    .filter((campaign): campaign is NonNullable<typeof campaign> => 
                      Boolean(campaign && campaign.id && campaign.name)
                    );
                  
                  const uniqueCampaigns = campaigns.reduce((acc, campaign) => {
                    if (!acc.find(c => c.id === campaign.id)) {
                      acc.push(campaign);
                    }
                    return acc;
                  }, [] as typeof campaigns);
                  
                  return uniqueCampaigns;
                })().map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className={cn(getPillClasses('campaign', 'small'), 'whitespace-normal break-words sm:whitespace-nowrap')}
                  >
                    <span className="font-semibold">{campaign.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm font-mono uppercase tracking-wider text-[var(--gray-500)]">No campaign affiliations yet.</p>
            )}
          </section>

          {/* Affiliations Section */}
          <section className="space-y-4 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">Affiliations</h3>
            </div>
            {groupAffiliations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {groupAffiliations.map((affiliation) => (
                  <Link
                    key={affiliation.id}
                    href={`/groups/${affiliation.id}`}
                    className={cn(getPillClasses('group', 'small'), 'whitespace-normal break-words sm:whitespace-nowrap')}
                  >
                    <span className="font-semibold">{affiliation.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm font-mono uppercase tracking-wider text-[var(--gray-500)]">No group affiliations yet.</p>
            )}
          </section>
        </div>


        {/* Sessions */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">Sessions</h3>
            {allSessions.length > 0 ? (
              /* Dropdown control to link/unlink sessions without large inline form */
              <SessionManager
                characterId={id}
                options={dropdownOptions}
                emptyMessage="No sessions available"
                submitLabel="Save Sessions"
                className="w-full sm:w-auto sm:max-w-xs"
                menuWidthClass="w-full sm:w-60"
              />
            ) : (
              <p className="text-xs text-[var(--gray-500)] font-mono uppercase tracking-wider sm:text-right">Create a session to link it.</p>
            )}
          </div>

          {linkedSessions.length > 0 ? (
            <div className="space-y-4">
              {linkedSessions.map((session) => {
                const sessionNumber = sessionNumberMap.get(session.id)
                return (
                  <CharacterSessionCard
                    key={session.id}
                    session={session}
                    sessionNumber={sessionNumber}
                  />
                )
              })}
            </div>
          ) : (
            <p className="text-[var(--gray-500)] font-mono italic">No related sessions yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
