import { LocationForm } from '@/components/locations/location-form'
import { createLocation } from '@/lib/actions/locations'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'
import { createClient } from '@/lib/supabase/server'

export default async function NewLocationPage() {
  const supabase = await createClient()

  const [campaignsResult, sessionsResult, groupsResult, charactersResult, locationsResult] = await Promise.all([
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('groups').select('id, name').order('name'),
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('locations').select('id, name').order('name'),
  ])

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
        <h1 className="retro-title text-2xl font-bold text-[var(--cyber-cyan)]">Create Location</h1>
        <p className="text-sm text-[var(--text-muted)]">Document a new landmark and link it across your world.</p>
      </div>

      <LocationForm
        action={createLocation}
        cancelHref="/locations"
        submitLabel="Save Location"
        mentionTargets={mentionTargets}
        campaignOptions={campaignOptions}
        sessionOptions={sessionOptions}
        groupOptions={groupOptions}
        characterOptions={characterOptions}
      />
    </div>
  )
}
