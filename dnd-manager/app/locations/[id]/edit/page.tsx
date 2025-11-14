import { notFound } from 'next/navigation'
import { LocationForm } from '@/components/locations/location-form'
import { updateLocation } from '@/lib/actions/locations'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'
import { createClient } from '@/lib/supabase/server'

interface EditLocationPageProps {
  params: { id: string }
}

export default async function EditLocationPage({ params }: EditLocationPageProps) {
  const { id } = params
  const supabase = await createClient()

  const [locationResult, campaignsResult, sessionsResult, groupsResult, charactersResult, locationsResult] = await Promise.all([
    supabase
      .from('locations')
      .select(`
        id,
        name,
        summary,
        description,
        primary_campaign_id,
        map_marker_icon,
        location_campaigns ( campaign_id ),
        location_sessions ( session_id ),
        location_groups ( group_id ),
        location_characters ( character_id )
      `)
      .eq('id', id)
      .single(),
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('groups').select('id, name').order('name'),
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('locations').select('id, name').order('name'),
  ])

  if (locationResult.error) {
    if (locationResult.error.code === 'PGRST116') {
      notFound()
    }
    throw new Error(locationResult.error.message)
  }
  if (campaignsResult.error) {
    throw new Error(campaignsResult.error.message)
  }
  if (sessionsResult.error) {
    throw new Error(sessionsResult.error.message)
  }
  if (groupsResult.error) {
    throw new Error(groupsResult.error.message)
  }
  if (charactersResult.error) {
    throw new Error(charactersResult.error.message)
  }
  if (locationsResult.error) {
    throw new Error(locationsResult.error.message)
  }

  const location = locationResult.data
  if (!location) {
    notFound()
  }

  const campaignOptions = (campaignsResult.data ?? []).map((campaign) => ({
    value: campaign.id,
    label: campaign.name ?? 'Untitled Campaign',
  }))

  const sessionOptions = (sessionsResult.data ?? []).map((session) => ({
    value: session.id,
    label: session.name ?? 'Untitled Session',
  }))

  const groupOptions = (groupsResult.data ?? []).map((group) => ({
    value: group.id,
    label: group.name ?? 'Untitled Group',
  }))

  const characterOptions = (charactersResult.data ?? []).map((character) => ({
    value: character.id,
    label: character.name ?? 'Unnamed Character',
  }))

  const defaultValues = {
    name: location.name ?? '',
    summary: location.summary ?? '',
    description: location.description ?? '',
    primaryCampaignId: location.primary_campaign_id ?? null,
    markerUrl: location.map_marker_icon ?? null,
    campaignIds: Array.isArray(location.location_campaigns)
      ? location.location_campaigns.map((entry) => String(entry.campaign_id))
      : [],
    sessionIds: Array.isArray(location.location_sessions)
      ? location.location_sessions.map((entry) => String(entry.session_id))
      : [],
    groupIds: Array.isArray(location.location_groups)
      ? location.location_groups.map((entry) => String(entry.group_id))
      : [],
    characterIds: Array.isArray(location.location_characters)
      ? location.location_characters.map((entry) => String(entry.character_id))
      : [],
  }

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(locationsResult.data ?? [], 'location', (entry) => `/locations/${entry.id}`),
    mapEntitiesToMentionTargets(campaignsResult.data ?? [], 'campaign', (entry) => `/campaigns/${entry.id}`),
    mapEntitiesToMentionTargets(sessionsResult.data ?? [], 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(groupsResult.data ?? [], 'group', (entry) => `/groups/${entry.id}`),
    mapEntitiesToMentionTargets(charactersResult.data ?? [], 'character', (entry) => `/characters/${entry.id}`),
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="retro-title text-2xl font-bold text-[var(--cyber-cyan)]">Edit Location</h1>
        <p className="text-sm text-[var(--text-muted)]">Update associations and notes for this location.</p>
      </div>

      <LocationForm
        action={async (formData) => updateLocation(id, formData)}
        cancelHref={`/locations/${id}`}
        submitLabel="Update Location"
        mentionTargets={mentionTargets}
        campaignOptions={campaignOptions}
        sessionOptions={sessionOptions}
        groupOptions={groupOptions}
        characterOptions={characterOptions}
        defaultValues={defaultValues}
      />
    </div>
  )
}
