import LocationForm from '@/components/forms/location-form'
import { createLocation } from '@/lib/actions/locations'
import { createClient } from '@/lib/supabase/server'
import { mapEntitiesToMentionTargets, mergeMentionTargets, type MentionTarget } from '@/lib/mention-utils'

export default async function NewLocationPage() {
  const supabase = await createClient()
  const [{ data: campaigns }, { data: sessions }, { data: characters }, { data: groups }] = await Promise.all([
    supabase.from('campaigns').select('id, name'),
    supabase.from('sessions').select('id, name'),
    supabase.from('characters').select('id, name'),
    supabase.from('groups').select('id, name'),
  ])

  const mentionTargets: MentionTarget[] = mergeMentionTargets(
    mapEntitiesToMentionTargets(campaigns ?? [], 'campaign', (entry) => `/campaigns/${entry.id}`),
    mapEntitiesToMentionTargets(sessions ?? [], 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(characters ?? [], 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(groups ?? [], 'group', (entry) => `/groups/${entry.id}`),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">New Location</h1>
        <p className="text-sm text-[var(--text-secondary)]">Add a place and link it to your stories.</p>
      </div>
      <LocationForm action={createLocation} mentionTargets={mentionTargets} />
    </div>
  )
}
