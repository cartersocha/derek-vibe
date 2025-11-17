import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { renderNotesWithMentions, mapEntitiesToMentionTargets, mergeMentionTargets, type MentionTarget } from '@/lib/mention-utils'
import { Button } from '@/components/ui/button'

interface LocationPageProps {
  params: { id: string }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const supabase = await createClient()

  const [{ data: location }, { data: campaigns }, { data: sessions }, { data: characters }, { data: groups }, { data: locations }] =
    await Promise.all([
      supabase.from('locations').select('*').eq('id', params.id).single(),
      supabase.from('campaigns').select('id, name'),
      supabase.from('sessions').select('id, name'),
      supabase.from('characters').select('id, name'),
      supabase.from('groups').select('id, name'),
      supabase.from('locations').select('id, name'),
    ])

  if (!location) {
    notFound()
  }

  const mentionTargets: MentionTarget[] = mergeMentionTargets(
    mapEntitiesToMentionTargets(campaigns ?? [], 'campaign', (entry) => `/campaigns/${entry.id}`),
    mapEntitiesToMentionTargets(sessions ?? [], 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(characters ?? [], 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(groups ?? [], 'group', (entry) => `/groups/${entry.id}`),
    mapEntitiesToMentionTargets(locations ?? [], 'location', (entry) => `/locations/${entry.id}`),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">Location</p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">{location.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/locations/${location.id}/edit`}>Edit</Link>
          </Button>
          <Button asChild>
            <Link href="/locations/new">New</Link>
          </Button>
        </div>
      </div>

      {location.header_image_url && (
        <div className="overflow-hidden rounded-lg border border-[var(--border-muted)] shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={location.header_image_url} alt="Location header" className="w-full object-cover" />
        </div>
      )}

      <div className="grid gap-4 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">Created</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {new Date(location.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {location.description && (
        <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">Notes</p>
          <div className="prose prose-invert mt-2 max-w-none text-[var(--text-primary)]">
            {renderNotesWithMentions(location.description, mentionTargets)}
          </div>
        </div>
      )}
    </div>
  )
}
