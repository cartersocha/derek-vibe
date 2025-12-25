import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPillClasses } from '@/lib/utils/pill-styles'
import { mapEntitiesToMentionTargets, mergeMentionTargets, renderNotesWithMentions } from '@/lib/mention-utils'

interface LocationPageProps {
  params: { id: string }
}

export default async function LocationDetailPage({ params }: LocationPageProps) {
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
        created_at,
        updated_at,
        primary_campaign:campaigns!locations_primary_campaign_id_fkey ( id, name ),
        location_campaigns ( campaign:campaigns ( id, name ) ),
        location_sessions ( session:sessions ( id, name, session_date ) ),
        location_groups ( group:groups ( id, name ) ),
        location_characters ( character:characters ( id, name ) )
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

  const primaryCampaign = Array.isArray(location.primary_campaign)
    ? location.primary_campaign[0]
    : location.primary_campaign

  const campaigns = Array.isArray(location.location_campaigns)
    ? location.location_campaigns
        .map((membership) => {
          const raw = Array.isArray(membership?.campaign) ? membership.campaign[0] : membership?.campaign
          if (!raw?.id || !raw?.name) {
            return null
          }
          return { id: String(raw.id), name: String(raw.name) }
        })
        .filter((value): value is { id: string; name: string } => value !== null)
    : []

  const sessions = Array.isArray(location.location_sessions)
    ? location.location_sessions
        .map((membership) => {
          const raw = Array.isArray(membership?.session) ? membership.session[0] : membership?.session
          if (!raw?.id || !raw?.name) {
            return null
          }
          return {
            id: String(raw.id),
            name: String(raw.name),
            session_date: raw.session_date ? String(raw.session_date) : null,
          }
        })
        .filter((value): value is { id: string; name: string; session_date: string | null } => value !== null)
    : []

  const groups = Array.isArray(location.location_groups)
    ? location.location_groups
        .map((membership) => {
          const raw = Array.isArray(membership?.group) ? membership.group[0] : membership?.group
          if (!raw?.id || !raw?.name) {
            return null
          }
          return { id: String(raw.id), name: String(raw.name) }
        })
        .filter((value): value is { id: string; name: string } => value !== null)
    : []

  const characters = Array.isArray(location.location_characters)
    ? location.location_characters
        .map((membership) => {
          const raw = Array.isArray(membership?.character) ? membership.character[0] : membership?.character
          if (!raw?.id || !raw?.name) {
            return null
          }
          return { id: String(raw.id), name: String(raw.name) }
        })
        .filter((value): value is { id: string; name: string } => value !== null)
    : []

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(locationsResult.data ?? [], 'location', (entry) => `/locations/${entry.id}`),
    mapEntitiesToMentionTargets(campaignsResult.data ?? [], 'campaign', (entry) => `/campaigns/${entry.id}`),
    mapEntitiesToMentionTargets(sessionsResult.data ?? [], 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(groupsResult.data ?? [], 'group', (entry) => `/groups/${entry.id}`),
    mapEntitiesToMentionTargets(charactersResult.data ?? [], 'character', (entry) => `/characters/${entry.id}`),
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="retro-title text-3xl font-bold text-[var(--cyber-cyan)]">{location.name}</h1>
          {location.summary ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">{location.summary}</p>
          ) : null}
          {primaryCampaign?.id ? (
            <div className="mt-3">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">Primary Campaign:</span>{' '}
              <Link href={`/campaigns/${primaryCampaign.id}`} className={getPillClasses('campaign', 'small')}>
                {primaryCampaign.name}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/maps"
            className={getPillClasses('location', 'small')}
          >
            Open Maps
          </Link>
          <Link
            href={`/locations/${id}/edit`}
            className="inline-flex items-center justify-center rounded border border-[var(--cyber-cyan)]/60 px-5 py-2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--cyber-cyan)] transition hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)]"
          >
            Edit
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/70 p-6 shadow-2xl shadow-[var(--cyber-cyan)]/10">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--cyber-cyan)]">Description</h2>
        <div className="prose prose-invert mt-4 max-w-none text-[var(--text-primary)]">
          {location.description ? renderNotesWithMentions(location.description, mentionTargets) : <p>No details yet.</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/60 p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--cyber-cyan)]">Campaigns</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className={getPillClasses('campaign', 'tiny')}>
                  {campaign.name}
                </Link>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No linked campaigns.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/60 p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--cyber-cyan)]">Sessions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <Link key={session.id} href={`/sessions/${session.id}`} className={getPillClasses('session', 'tiny')}>
                  {session.name}
                </Link>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No sessions recorded here.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/60 p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--cyber-cyan)]">Groups</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {groups.length > 0 ? (
              groups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`} className={getPillClasses('group', 'tiny')}>
                  {group.name}
                </Link>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No groups anchored here.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--cyber-cyan)]/20 bg-[var(--bg-card)]/60 p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--cyber-cyan)]">Characters</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {characters.length > 0 ? (
              characters.map((character) => (
                <Link key={character.id} href={`/characters/${character.id}`} className={getPillClasses('player', 'tiny')}>
                  {character.name}
                </Link>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No notable characters linked.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
