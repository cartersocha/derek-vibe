import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPillClasses } from '@/lib/utils/pill-styles'

export const runtime = 'edge'
export const revalidate = 300
export const fetchCache = 'force-cache'

interface LocationRecord {
  id: string
  name: string
  summary: string | null
  map_marker_icon: string | null
  campaigns: Array<{ id: string; name: string }>
  sessions: Array<{ id: string; name: string }>
  groups: Array<{ id: string; name: string }>
  characters: Array<{ id: string; name: string }>
}

export default async function LocationsPage() {
  const supabase = await createClient()

  const [locationsResult, campaignsResult, sessionsResult, groupsResult, charactersResult] = await Promise.all([
    supabase
      .from('locations')
      .select(`
        id,
        name,
        summary,
        map_marker_icon,
        location_campaigns ( campaign:campaigns ( id, name ) ),
        location_sessions ( session:sessions ( id, name ) ),
        location_groups ( group:groups ( id, name ) ),
        location_characters ( character:characters ( id, name ) )
      `)
      .order('name', { ascending: true }),
    supabase.from('campaigns').select('id, name').order('name', { ascending: true }),
    supabase.from('sessions').select('id, name').order('name', { ascending: true }),
    supabase.from('groups').select('id, name').order('name', { ascending: true }),
    supabase.from('characters').select('id, name').order('name', { ascending: true }),
  ])

  if (locationsResult.error) {
    throw new Error(locationsResult.error.message)
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

  const locations: LocationRecord[] = (locationsResult.data ?? []).map((entry) => {
    const campaigns = Array.isArray(entry?.location_campaigns)
      ? entry.location_campaigns
          .map((membership) => {
            const raw = Array.isArray(membership?.campaign) ? membership.campaign[0] : membership?.campaign
            if (!raw?.id || !raw?.name) {
              return null
            }
            return { id: String(raw.id), name: String(raw.name) }
          })
          .filter((value): value is { id: string; name: string } => value !== null)
      : []

    const sessions = Array.isArray(entry?.location_sessions)
      ? entry.location_sessions
          .map((membership) => {
            const raw = Array.isArray(membership?.session) ? membership.session[0] : membership?.session
            if (!raw?.id || !raw?.name) {
              return null
            }
            return { id: String(raw.id), name: String(raw.name) }
          })
          .filter((value): value is { id: string; name: string } => value !== null)
      : []

    const groups = Array.isArray(entry?.location_groups)
      ? entry.location_groups
          .map((membership) => {
            const raw = Array.isArray(membership?.group) ? membership.group[0] : membership?.group
            if (!raw?.id || !raw?.name) {
              return null
            }
            return { id: String(raw.id), name: String(raw.name) }
          })
          .filter((value): value is { id: string; name: string } => value !== null)
      : []

    const characters = Array.isArray(entry?.location_characters)
      ? entry.location_characters
          .map((membership) => {
            const raw = Array.isArray(membership?.character) ? membership.character[0] : membership?.character
            if (!raw?.id || !raw?.name) {
              return null
            }
            return { id: String(raw.id), name: String(raw.name) }
          })
          .filter((value): value is { id: string; name: string } => value !== null)
      : []

    return {
      id: String(entry.id),
      name: String(entry.name),
      summary: typeof entry.summary === 'string' ? entry.summary : null,
      map_marker_icon: entry.map_marker_icon ? String(entry.map_marker_icon) : null,
      campaigns,
      sessions,
      groups,
      characters,
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="retro-title text-2xl font-bold text-[var(--cyber-cyan)]">Locations</h1>
          <p className="text-sm text-[var(--text-muted)]">Map every hideout, sanctuary, and battleground.</p>
        </div>
        <Link
          href="/locations/new"
          className="inline-flex items-center justify-center rounded bg-[var(--cyber-magenta)] px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.3em] text-black shadow-lg shadow-[var(--cyber-magenta)]/40 transition hover:bg-[var(--cyber-magenta)]/90"
        >
          New Location
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {locations.map((location) => (
          <article
            key={location.id}
            className="rounded-xl border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/70 p-6 shadow-2xl shadow-[var(--cyber-cyan)]/10 hover:shadow-[var(--cyber-lime)]/20 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--cyber-cyan)]">{location.name}</h2>
                {location.summary ? (
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{location.summary}</p>
                ) : null}
              </div>
              <Link
                href={`/locations/${location.id}`}
                className={getPillClasses('location', 'small')}
              >
                View
              </Link>
            </div>

            <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
              {location.campaigns.length > 0 ? (
                <div>
                  <h3 className="font-mono uppercase tracking-[0.3em] text-[var(--cyber-cyan)] text-xs mb-1">Campaigns</h3>
                  <div className="flex flex-wrap gap-2">
                    {location.campaigns.map((campaign) => (
                      <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className={getPillClasses('campaign', 'tiny')}>
                        {campaign.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {location.sessions.length > 0 ? (
                <div>
                  <h3 className="font-mono uppercase tracking-[0.3em] text-[var(--cyber-cyan)] text-xs mb-1">Sessions</h3>
                  <div className="flex flex-wrap gap-2">
                    {location.sessions.map((session) => (
                      <Link key={session.id} href={`/sessions/${session.id}`} className={getPillClasses('session', 'tiny')}>
                        {session.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {location.groups.length > 0 ? (
                <div>
                  <h3 className="font-mono uppercase tracking-[0.3em] text-[var(--cyber-cyan)] text-xs mb-1">Groups</h3>
                  <div className="flex flex-wrap gap-2">
                    {location.groups.map((group) => (
                      <Link key={group.id} href={`/groups/${group.id}`} className={getPillClasses('group', 'tiny')}>
                        {group.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {location.characters.length > 0 ? (
                <div>
                  <h3 className="font-mono uppercase tracking-[0.3em] text-[var(--cyber-cyan)] text-xs mb-1">Characters</h3>
                  <div className="flex flex-wrap gap-2">
                    {location.characters.map((character) => (
                      <Link key={character.id} href={`/characters/${character.id}`} className={getPillClasses('player', 'tiny')}>
                        {character.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
