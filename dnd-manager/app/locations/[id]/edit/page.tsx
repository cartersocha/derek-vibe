import LocationForm from '@/components/forms/location-form'
import { updateLocation } from '@/lib/actions/locations'
import { createClient } from '@/lib/supabase/server'
import { mapEntitiesToMentionTargets, mergeMentionTargets, type MentionTarget } from '@/lib/mention-utils'

interface EditLocationPageProps {
  params: { id: string }
}

export default async function EditLocationPage({ params }: EditLocationPageProps) {
  const supabase = await createClient()

  const [{ data: location }, { data: campaigns }, { data: sessions }, { data: characters }, { data: groups }] = await Promise.all([
    supabase.from('locations').select('*').eq('id', params.id).single(),
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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit Location</h1>
        <p className="text-sm text-[var(--text-secondary)]">Update the details for this place.</p>
      </div>
      <LocationForm
        action={(formData) => updateLocation(params.id, formData)}
        initialData={location}
        mentionTargets={mentionTargets}
      />
    </div>
  )
}
