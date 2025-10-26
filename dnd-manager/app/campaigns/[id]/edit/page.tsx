import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCampaign } from '@/lib/actions/campaigns'
import { CampaignForm } from '@/components/forms/campaign-form'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'

export default async function CampaignEditPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [organizationLinksResult, sessionQueryResult, characterLinksResult] = await Promise.all([
    supabase.from('organization_campaigns').select('organization_id').eq('campaign_id', id),
    supabase
      .from('sessions')
      .select(`
        id,
        name,
        campaign_id,
        campaign:campaigns(name),
        session_characters:session_characters(character_id),
        organization_sessions:organization_sessions(organization_id)
      `)
      .order('name'),
    supabase.from('campaign_characters').select('character_id').eq('campaign_id', id),
  ])

  const isMissingCampaignCharactersTable = (error: { message?: string | null; code?: string | null } | null | undefined) => {
    if (!error) {
      return false
    }

    const code = error.code?.toUpperCase()
    if (code === '42P01') {
      return true
    }

    const message = error.message?.toLowerCase() ?? ''
    return message.includes('campaign_characters')
  }

  const [{ data: organizations }, { data: characters }, { data: campaigns }] = await Promise.all([
    supabase.from('organizations').select('id, name').order('name'),
    supabase.from('characters').select('id, name, player_type, status').order('name'),
    supabase.from('campaigns').select('id, name').order('name'),
  ])

  const defaultOrganizationIds = (organizationLinksResult.data ?? [])
    .map((entry) => entry.organization_id)
    .filter((value): value is string => Boolean(value))

  const sessionRows = sessionQueryResult.data ?? []
  const defaultSessionIds = sessionRows
    .filter((session) => session.campaign_id === id)
    .map((session) => session.id)

  if (characterLinksResult.error && !isMissingCampaignCharactersTable(characterLinksResult.error)) {
    throw new Error(characterLinksResult.error.message)
  }

  const characterLinkRows = isMissingCampaignCharactersTable(characterLinksResult.error)
    ? []
    : (characterLinksResult.data ?? [])

  const defaultCharacterIds = characterLinkRows
    .map((entry) => entry.character_id)
    .filter((value): value is string => Boolean(value))

  const organizationOptions = (organizations ?? []).map((organization) => ({
    id: organization.id,
    name: organization.name ?? 'Untitled Group',
  }))

  type SessionRow = {
    id: string
    name: string | null
    campaign_id: string | null
    campaign?: { name?: string } | Array<{ name?: string }>
    session_characters?: Array<{ character_id: string }> | null
    organization_sessions?: Array<{ organization_id: string }> | null
  }

  const sessionOptions = (sessionRows as SessionRow[]).map((session) => {
    const relatedCampaign = session.campaign
    const campaignName = Array.isArray(relatedCampaign)
      ? relatedCampaign[0]?.name
      : relatedCampaign?.name

    // Extract character IDs from this session
    const characterIds = (session.session_characters ?? [])
      .map((sc) => sc.character_id)
      .filter(Boolean)

    // Extract organization IDs from this session
    const organizationIds = (session.organization_sessions ?? [])
      .map((os) => os.organization_id)
      .filter(Boolean)

    return {
      id: session.id,
      name: session.name ?? 'Untitled Session',
      hint: campaignName && session.campaign_id !== id ? `Assigned to ${campaignName}` : null,
      characterIds,
      organizationIds,
    }
  })

  const characterOptions = (characters ?? []).map((character) => ({
    id: character.id,
    name: character.name ?? 'Unnamed Character',
    hint: [character.player_type, character.status]
      .filter(Boolean)
      .map((value) => String(value).toUpperCase())
      .join(' • '),
  }))

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(characters, 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(organizations, 'organization', (entry) => `/organizations/${entry.id}`),
    mapEntitiesToMentionTargets(sessionRows, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(campaigns, 'campaign', (entry) => `/campaigns/${entry.id}`)
  )

  const updateCampaignWithId = updateCampaign.bind(null, id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/campaigns/${id}`} className="text-[var(--orange-400)] hover:text-[var(--orange-500)] font-mono uppercase tracking-wider">
          ← Back to Campaign
        </Link>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider break-words">Edit Campaign</h2>

      <CampaignForm
        action={updateCampaignWithId}
        cancelHref={`/campaigns/${id}`}
        submitLabel="Save Changes"
        defaultValues={{
          name: campaign.name,
          description: campaign.description,
          createdAt: campaign.created_at,
        }}
        organizations={organizationOptions}
        sessions={sessionOptions}
        characters={characterOptions}
        defaultOrganizationIds={defaultOrganizationIds}
        defaultSessionIds={defaultSessionIds}
        defaultCharacterIds={defaultCharacterIds}
        campaignId={id}
        mentionTargets={mentionTargets}
      />
    </div>
  )
}
