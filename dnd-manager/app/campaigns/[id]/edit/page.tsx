import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCampaign } from '@/lib/actions/campaigns'
import { CampaignForm } from '@/components/forms/campaign-form'

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
      .select('id, name, campaign_id, campaign:campaigns(name)')
      .order('name'),
    supabase.from('campaign_characters').select('character_id').eq('campaign_id', id),
  ])

  const [{ data: organizations }, { data: characters }] = await Promise.all([
    supabase.from('organizations').select('id, name').order('name'),
    supabase.from('characters').select('id, name, player_type, status').order('name'),
  ])

  const defaultOrganizationIds = (organizationLinksResult.data ?? [])
    .map((entry) => entry.organization_id)
    .filter((value): value is string => Boolean(value))

  const sessionRows = sessionQueryResult.data ?? []
  const defaultSessionIds = sessionRows
    .filter((session) => session.campaign_id === id)
    .map((session) => session.id)

  const defaultCharacterIds = (characterLinksResult.data ?? [])
    .map((entry) => entry.character_id)
    .filter((value): value is string => Boolean(value))

  const organizationOptions = (organizations ?? []).map((organization) => ({
    id: organization.id,
    name: organization.name ?? 'Untitled Group',
  }))

  const sessionOptions = sessionRows.map((session) => {
    const relatedCampaign = (session as unknown as { campaign?: { name?: string } | Array<{ name?: string }> }).campaign
    const campaignName = Array.isArray(relatedCampaign)
      ? relatedCampaign[0]?.name
      : relatedCampaign?.name

    return {
      id: session.id,
      name: session.name ?? 'Untitled Session',
      hint: campaignName && session.campaign_id !== id ? `Assigned to ${campaignName}` : null,
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

  const updateCampaignWithId = updateCampaign.bind(null, id)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/campaigns/${id}`} className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Campaign
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Edit Campaign</h2>

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
      />
    </div>
  )
}
