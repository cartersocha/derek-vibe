import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteCampaign } from '@/lib/actions/campaigns'
import { DeleteCampaignButton } from '@/components/ui/delete-campaign-button'
import EditIcon from '@/components/ui/edit-icon'
import {
  extractPlayerSummaries,
  dateStringToLocalDate,
  formatTimestampForDisplay,
  type SessionCharacterRelation,
  getPillClasses,
  cn,
} from '@/lib/utils'
import { SessionParticipantPills } from '@/components/ui/session-participant-pills'
import { CampaignSessionCard } from '@/components/ui/campaign-session-card'
import { renderNotesWithMentions, mapEntitiesToMentionTargets, mergeMentionTargets, type MentionTarget } from '@/lib/mention-utils'
import type { SessionRow } from '@/lib/types/sessions'

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
    .eq('campaign_id', id)
    .order('session_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .returns<SessionRow[]>()

  const [
    { data: campaignCharacterRows, error: campaignCharacterError },
    { data: groupCampaignRows, error: groupCampaignError },
    { data: mentionCharacters },
    { data: mentionGroups },
    { data: mentionSessions },
    { data: mentionCampaigns },
  ] = await Promise.all([
    supabase
      .from('campaign_characters')
      .select(`
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
      `)
      .eq('campaign_id', id),
    supabase
      .from('group_campaigns')
      .select(`
        group:groups(id, name)
      `)
      .eq('campaign_id', id),
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('groups').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('campaigns').select('id, name').order('name'),
  ])

  const isMissingCampaignCharactersTable = (error: { message?: string | null; code?: string | null } | null | undefined) => {
    if (!error) return false
    const code = error.code?.toUpperCase()
    if (code === '42P01') return true
    const message = error.message?.toLowerCase() ?? ''
    return message.includes('campaign_characters')
  }

  if (campaignCharacterError && !isMissingCampaignCharactersTable(campaignCharacterError)) {
    throw new Error(campaignCharacterError.message)
  }

  if (groupCampaignError) {
    throw new Error(groupCampaignError.message)
  }

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
    const campaignRelation = Array.isArray(session.campaign)
      ? session.campaign[0] ?? null
      : session.campaign ?? null

    const groups = Array.isArray(session.session_groups)
      ? session.session_groups
          .map((entry) => {
            const org = Array.isArray(entry?.group) ? entry?.group?.[0] : entry?.group
            if (!org?.id || !org?.name) {
              return null
            }
            return { id: org.id, name: org.name }
          })
          .filter((value): value is { id: string; name: string } => Boolean(value))
      : []

    return {
      ...session,
      campaign: campaignRelation,
      players,
      groups,
      sessionNumber: sessionNumberMap.get(session.id) ?? null,
    }
  })

  const campaignCharacterRelations: SessionCharacterRelation[] =
    (campaignCharacterError && isMissingCampaignCharactersTable(campaignCharacterError))
      ? []
      : (campaignCharacterRows ?? []).map((row) => ({
          character: row.character,
        }))

  const campaignCharacters = extractPlayerSummaries(campaignCharacterRelations)

  const characterMap = new Map<string, typeof campaignCharacters[number]>()
  campaignCharacters.forEach((player) => {
    if (player.id) {
      characterMap.set(player.id, player)
    }
  })

  sessionsWithPlayers.forEach((session) => {
    session.players.forEach((player) => {
      if (player.id && !characterMap.has(player.id)) {
        characterMap.set(player.id, player)
      }
    })
  })

  const combinedCharacters = Array.from(characterMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  const groupMap = new Map<string, { id: string; name: string }>()

  const directGroups = (groupCampaignRows ?? [])
    .map((row) => {
      const entry = Array.isArray(row.group) ? row.group[0] : row.group
      if (!entry?.id || !entry?.name) {
        return null
      }
      return { id: entry.id, name: entry.name }
    })
    .filter((value): value is { id: string; name: string } => Boolean(value))

  directGroups.forEach((org) => {
    groupMap.set(org.id, org)
  })

  const combinedGroups = Array.from(groupMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  const mentionTargets: MentionTarget[] = mergeMentionTargets(
    mapEntitiesToMentionTargets(mentionCharacters ?? [], 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(mentionGroups ?? [], 'group', (entry) => `/groups/${entry.id}`),
    mapEntitiesToMentionTargets(mentionSessions ?? rawSessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(mentionCampaigns ?? [], 'campaign', (entry) => `/campaigns/${entry.id}`)
  )

  const deleteCampaignWithId = deleteCampaign.bind(null, id)

  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl pt-4 px-8 pb-8 space-y-8">
        <div className="flex flex-row flex-wrap items-center gap-3 justify-between">
          <Link href="/campaigns" className="text-[var(--cyber-cyan)] hover-cyber font-mono uppercase tracking-wider">
            ← Back to Campaigns
          </Link>
          <div className="flex flex-row flex-wrap items-center gap-2 ml-auto">
            <Link
              href={`/campaigns/${id}/edit`}
              className="inline-flex self-start w-auto h-10 bg-[var(--cyber-magenta)] text-black px-4 text-sm sm:text-base rounded font-bold uppercase tracking-wider hover-brightness transition-all duration-200 shadow-lg shadow-[var(--cyber-magenta)]/50 text-center items-center justify-center"
            >
              <EditIcon size="sm" className="bg-black" />
            </Link>
            <form action={deleteCampaignWithId}>
              <DeleteCampaignButton />
            </form>
          </div>
        </div>
        {/* Campaign Name and Description */}
        <div>
          <h1 className="retro-title text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--cyber-cyan)] mb-4 text-center break-words">{campaign.name}</h1>
          {campaign.description && (
            <div className="bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded p-6">
              <div className="text-[var(--gray-300)] whitespace-pre-wrap font-mono dynamic-text">
                {renderNotesWithMentions(campaign.description, mentionTargets)}
              </div>
            </div>
          )}
        </div>

        {/* Campaign Stats */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Sessions</div>
            <div className="text-3xl font-bold text-[var(--cyber-cyan)]">{rawSessions.length}</div>
          </div>
          <div className="bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Created</div>
            <div className="text-lg font-bold">
              <span className={getPillClasses('date', 'small')}>
                {formatTimestampForDisplay(
                  campaign.created_at,
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                ) ?? 'Unknown'}
              </span>
            </div>
          </div>
          <div className="bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Last Updated</div>
            <div className="text-lg font-bold">
              <span className={getPillClasses('date', 'small')}>
                {formatTimestampForDisplay(
                  campaign.updated_at,
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                ) ?? 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Campaign Characters */}
        <div className="space-y-4">
          <div>
            <h2 className="mb-4 text-xl font-bold uppercase tracking-wider text-[var(--cyber-cyan)]"
              style={{
                fontFamily: 'var(--font-press-start), monospace',
                WebkitFontSmoothing: 'none',
                fontSmoothing: 'never'
              } as React.CSSProperties}>Characters</h2>
            {combinedCharacters.length === 0 ? (
              <p className="text-sm font-mono text-[var(--text-muted)]">
                No characters have been linked to this campaign yet.
              </p>
            ) : (
              <SessionParticipantPills
                sessionId={`campaign-${id}`}
                players={combinedCharacters}
                className="pointer-events-auto"
                showGroups={false}
              />
            )}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold uppercase tracking-wider text-[var(--cyber-cyan)]"
              style={{
                fontFamily: 'var(--font-press-start), monospace',
                WebkitFontSmoothing: 'none',
                fontSmoothing: 'never'
              } as React.CSSProperties}>Groups</h2>
            {combinedGroups.length === 0 ? (
              <p className="text-sm font-mono text-[var(--text-muted)]">
                No groups have been linked to this campaign yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {combinedGroups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className={cn(getPillClasses('group', 'small'), 'whitespace-nowrap')}
                  >
                    {group.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider"
              style={{
                fontFamily: 'var(--font-press-start), monospace',
                WebkitFontSmoothing: 'none',
                fontSmoothing: 'never'
              } as React.CSSProperties}>Sessions</h2>
          </div>

          {rawSessions.length === 0 ? (
            <div className="bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded p-8 text-center">
              <p className="text-[var(--text-muted)] font-mono mb-4">No sessions yet for this campaign</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionsWithPlayers.map((session) => {
                return (
                  <CampaignSessionCard
                    key={session.id}
                    session={session}
                    mentionTargets={mentionTargets}
                    sessionNumber={session.sessionNumber}
                    campaignRelation={{ id: campaign.id, name: campaign.name }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
