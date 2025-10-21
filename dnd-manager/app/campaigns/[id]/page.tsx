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
          organization_memberships:organization_characters(
            organizations(id, name)
          )
        )
      ),
      session_organizations:organization_sessions(
        organization:organizations(id, name)
      )
    `)
    .eq('campaign_id', id)
    .order('session_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .returns<SessionRow[]>()

  const [
    { data: campaignCharacterRows, error: campaignCharacterError },
    { data: organizationCampaignRows, error: organizationCampaignError },
    { data: mentionCharacters },
    { data: mentionOrganizations },
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
          organization_memberships:organization_characters(
            organizations(id, name)
          )
        )
      `)
      .eq('campaign_id', id),
    supabase
      .from('organization_campaigns')
      .select(`
        organization:organizations(id, name)
      `)
      .eq('campaign_id', id),
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
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

  if (organizationCampaignError) {
    throw new Error(organizationCampaignError.message)
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

    const organizations = Array.isArray(session.session_organizations)
      ? session.session_organizations
          .map((entry) => {
            const org = Array.isArray(entry?.organization) ? entry?.organization?.[0] : entry?.organization
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
      organizations,
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

  const organizationMap = new Map<string, { id: string; name: string }>()

  const directOrganizations = (organizationCampaignRows ?? [])
    .map((row) => {
      const entry = Array.isArray(row.organization) ? row.organization[0] : row.organization
      if (!entry?.id || !entry?.name) {
        return null
      }
      return { id: entry.id, name: entry.name }
    })
    .filter((value): value is { id: string; name: string } => Boolean(value))

  directOrganizations.forEach((org) => {
    organizationMap.set(org.id, org)
  })

  const combinedOrganizations = Array.from(organizationMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  const mentionTargets: MentionTarget[] = mergeMentionTargets(
    mapEntitiesToMentionTargets(mentionCharacters ?? [], 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(mentionOrganizations ?? [], 'organization', (entry) => `/organizations/${entry.id}`),
    mapEntitiesToMentionTargets(mentionSessions ?? rawSessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(mentionCampaigns ?? [], 'campaign', (entry) => `/campaigns/${entry.id}`)
  )

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
          <h1 className="retro-title text-4xl font-bold text-[#00ffff] mb-4 text-center">{campaign.name}</h1>
          {campaign.description && (
            <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-6">
              <div className="text-gray-300 whitespace-pre-wrap font-mono">
                {renderNotesWithMentions(campaign.description, mentionTargets)}
              </div>
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

        {/* Campaign Characters */}
        <div className="space-y-4">
          <div>
            <h2 className="mb-4 text-xl font-bold uppercase tracking-wider text-[#00ffff]">Characters</h2>
            {combinedCharacters.length === 0 ? (
              <p className="text-sm font-mono text-gray-400">
                No characters have been linked to this campaign yet.
              </p>
            ) : (
              <SessionParticipantPills
                sessionId={`campaign-${id}`}
                players={combinedCharacters}
                className="pointer-events-auto"
                showOrganizations={false}
              />
            )}
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold uppercase tracking-[0.3em] text-[#00ffff]">Groups</h3>
            {combinedOrganizations.length === 0 ? (
              <p className="text-sm font-mono text-gray-400">
                No groups have been linked to this campaign yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {combinedOrganizations.map((organization) => (
                  <Link
                    key={organization.id}
                    href={`/organizations/${organization.id}`}
                    className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447]"
                  >
                    {organization.name}
                  </Link>
                ))}
              </div>
            )}
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
