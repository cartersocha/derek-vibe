import { createCampaign } from '@/lib/actions/campaigns'
import { createClient } from '@/lib/supabase/server'
import { CampaignForm } from '@/components/forms/campaign-form'

export default async function NewCampaignPage() {
  const supabase = await createClient()

  const [{ data: organizations }, { data: sessions }, { data: characters }] = await Promise.all([
    supabase.from('organizations').select('id, name').order('name'),
    supabase
      .from('sessions')
      .select('id, name, campaign:campaigns(name)')
      .order('name'),
    supabase
      .from('characters')
      .select('id, name, player_type, status')
      .order('name'),
  ])

  const organizationOptions = (organizations ?? []).map((organization) => ({
    id: organization.id,
    name: organization.name ?? 'Untitled Group',
  }))

  const sessionOptions = (sessions ?? []).map((session) => {
    const relatedCampaign = (session as unknown as { campaign?: { name?: string } | Array<{ name?: string }> }).campaign
    const campaignName = Array.isArray(relatedCampaign)
      ? relatedCampaign[0]?.name
      : relatedCampaign?.name

    return {
      id: session.id,
      name: session.name ?? 'Untitled Session',
      hint: campaignName ? `Assigned to ${campaignName}` : null,
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

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Create New Campaign</h1>
      </div>

      <CampaignForm
        action={createCampaign}
        cancelHref="/campaigns"
        submitLabel="Create Campaign"
  defaultValues={{ createdAt: today }}
        organizations={organizationOptions}
        sessions={sessionOptions}
        characters={characterOptions}
      />
    </div>
  )
}
