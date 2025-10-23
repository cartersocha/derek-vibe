import { createCampaign } from '@/lib/actions/campaigns'
import { createClient } from '@/lib/supabase/server'
import { CampaignForm } from '@/components/forms/campaign-form'
import { getTodayDateInputValue } from '@/lib/utils'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'

export default async function NewCampaignPage() {
  const supabase = await createClient()

  const [{ data: organizations }, { data: sessions }, { data: characters }, { data: campaigns }] = await Promise.all([
    supabase.from('organizations').select('id, name').order('name'),
    supabase
      .from('sessions')
      .select(`
        id,
        name,
        campaign:campaigns(name),
        session_characters:session_characters(character_id),
        organization_sessions:organization_sessions(organization_id)
      `)
      .order('name'),
    supabase
      .from('characters')
      .select('id, name, player_type, status')
      .order('name'),
    supabase.from('campaigns').select('id, name').order('name'),
  ])

  const organizationOptions = (organizations ?? []).map((organization) => ({
    id: organization.id,
    name: organization.name ?? 'Untitled Group',
  }))

  type SessionRow = {
    id: string
    name: string | null
    campaign?: { name?: string } | Array<{ name?: string }>
    session_characters?: Array<{ character_id: string }> | null
    organization_sessions?: Array<{ organization_id: string }> | null
  }

  const sessionRows = (sessions as SessionRow[] | null) ?? []
  const sessionOptions = sessionRows.map((session) => {
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
      hint: campaignName ? `Assigned to ${campaignName}` : null,
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

  const today = getTodayDateInputValue()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="retro-title text-3xl font-bold text-[#00ffff]">Create New Campaign</h1>
      </div>

      <CampaignForm
        action={createCampaign}
        cancelHref="/campaigns"
        submitLabel="Create Campaign"
        defaultValues={{ createdAt: today }}
        organizations={organizationOptions}
        sessions={sessionOptions}
        characters={characterOptions}
        mentionTargets={mentionTargets}
      />
    </div>
  )
}
