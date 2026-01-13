import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { mapEntitiesToMentionTargets, mergeMentionTargets, renderNotesWithMentions, type MentionTarget } from '@/lib/mention-utils'
import { Button } from '@/components/ui/button'
import { type Location } from '@/types/database'

export default async function LocationsPage() {
  const supabase = await createClient()

  const [{ data: locations }, { data: campaigns }, { data: sessions }, { data: characters }, { data: groups }] =
    await Promise.all([
      supabase.from('locations').select('*').order('created_at', { ascending: false }),
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
    mapEntitiesToMentionTargets(locations ?? [], 'location', (entry) => `/locations/${entry.id}`),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Locations</h1>
          <p className="text-sm text-[var(--text-secondary)]">Keep track of realms, taverns, and landmarks.</p>
        </div>
        <Button asChild>
          <Link href="/locations/new">New Location</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(locations ?? []).map((location: Location) => (
          <Link
            key={location.id}
            href={`/locations/${location.id}`}
            className="block rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-4 transition hover:border-[var(--cyber-cyan)] hover:shadow-[0_0_0_1px_var(--cyber-cyan)]"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{location.name}</h2>
            {location.description && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {renderNotesWithMentions(location.description, mentionTargets)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
