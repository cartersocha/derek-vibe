import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteSession } from '@/lib/actions/sessions'
import { DeleteSessionButton } from '@/components/ui/delete-session-button'
import { renderNotesWithMentions, type MentionTarget } from '@/lib/mention-utils'
import { formatDateStringForDisplay } from '@/lib/utils'
import { SessionCharacterCard } from '@/components/ui/session-character-card'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      campaign:campaigns(id, name)
    `)
    .eq('id', id)
    .single()

  if (!session) {
    notFound()
  }

  const sessionNumberMap = new Map<string, number>()

  if (session.campaign_id) {
    const { data: sessionsForCampaign } = await supabase
      .from('sessions')
      .select('id, name, session_date')
      .eq('campaign_id', session.campaign_id)
      .order('session_date', { ascending: true, nullsFirst: true })

    if (sessionsForCampaign) {
      let counter = 1
      for (const campaignSession of sessionsForCampaign) {
        if (campaignSession.session_date) {
          sessionNumberMap.set(campaignSession.id, counter)
          counter += 1
        }
      }
    }
  }

  // Fetch characters for this session
  const { data: sessionCharacters } = await supabase
    .from('session_characters')
    .select('character_id')
    .eq('session_id', id)

  const characterIds = sessionCharacters?.map(sc => sc.character_id) || []

  const { data: sessionOrganizations } = await supabase
    .from('organization_sessions')
    .select('organization:organizations(id, name)')
    .eq('session_id', id)

  const sessionGroups = (sessionOrganizations ?? [])
    .map((entry) => {
      const organization = Array.isArray(entry.organization) ? entry.organization[0] : entry.organization
      if (!organization?.id || !organization?.name) {
        return null
      }
      return {
        id: organization.id,
        name: organization.name,
      }
    })
    .filter((group): group is { id: string; name: string } => Boolean(group))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  
  type SessionCharacterRow = {
    id: string
    name: string
    level: string | null
    player_type: 'npc' | 'player' | null
    organization_memberships: Array<{
      organizations:
        | { id: string | null; name: string | null }
        | Array<{ id: string | null; name: string | null }>
    }> | null
  }

  let sessionChars: Array<{
    id: string
    name: string
    level: string | null
    player_type: 'npc' | 'player' | null
    organizations: { id: string; name: string }[]
  }> = []

  if (characterIds.length > 0) {
    const { data: charData } = await supabase
      .from('characters')
      .select(
        `
          id,
          name,
          level,
          player_type,
          organization_memberships:organization_characters(
            organizations(id, name)
          )
        `
      )
      .in('id', characterIds)

    sessionChars = (charData as SessionCharacterRow[] | null)?.map((character) => {
      const organizations: { id: string; name: string }[] = Array.isArray(character.organization_memberships)
        ? character.organization_memberships
            .flatMap((membership) => {
              const orgData = membership.organizations
              const organization = Array.isArray(orgData) ? orgData[0] : orgData
              if (!organization?.id || !organization?.name) {
                return []
              }
              return [{
                id: organization.id,
                name: organization.name,
              }]
            })
        : []

      return {
        id: character.id,
        name: character.name,
        level: character.level,
        player_type: character.player_type,
        organizations,
      }
    }) ?? []
  }

  const [
    { data: mentionCharacters },
    { data: mentionSessions },
    { data: mentionOrganizations },
    { data: mentionCampaigns },
  ] = await Promise.all([
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
    supabase.from('campaigns').select('id, name').order('name'),
  ])

  const mentionTargets = (() => {
    const map = new Map<string, MentionTarget>()

    const addTarget = (target: MentionTarget) => {
      if (!target.id || !target.name) {
        return
      }
      map.set(`${target.kind}:${target.id}`, target)
    }

    for (const character of mentionCharacters ?? []) {
      if (!character?.id || !character?.name) {
        continue
      }
      addTarget({
        id: character.id,
        name: character.name,
        href: `/characters/${character.id}`,
        kind: 'character',
      })
    }

    for (const sessionEntry of mentionSessions ?? []) {
      if (!sessionEntry?.id || !sessionEntry?.name) {
        continue
      }
      addTarget({
        id: sessionEntry.id,
        name: sessionEntry.name,
        href: `/sessions/${sessionEntry.id}`,
        kind: 'session',
      })
    }

    for (const organization of mentionOrganizations ?? []) {
      if (!organization?.id || !organization?.name) {
        continue
      }
      addTarget({
        id: organization.id,
        name: organization.name,
        href: `/organizations/${organization.id}`,
        kind: 'organization',
      })
    }

    for (const campaign of mentionCampaigns ?? []) {
      if (!campaign?.id || !campaign?.name) {
        continue
      }
      addTarget({
        id: campaign.id,
        name: campaign.name,
        href: `/campaigns/${campaign.id}`,
        kind: 'campaign',
      })
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  })()

  const deleteSessionWithId = deleteSession.bind(null, id)

  const campaignSessionNumber = sessionNumberMap.get(session.id)
  const sessionDateLabel = formatDateStringForDisplay(
    session.session_date,
    'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl pt-4 px-8 pb-8 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/sessions" className="text-[var(--cyber-cyan)] hover-cyber font-mono uppercase tracking-wider">
            ← Back to Sessions
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/sessions/${id}/edit`}
              className="w-full sm:w-auto bg-[var(--cyber-magenta)] text-black px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover-brightness transition-all duration-200 shadow-lg shadow-[var(--cyber-magenta)]/50 text-center"
            >
              Edit Session
            </Link>
            <form action={deleteSessionWithId}>
              <DeleteSessionButton />
            </form>
          </div>
        </div>
        
        <div className="-mt-4">
          {/* Header Image */}
          {session.header_image_url && (
            <div className="relative w-full h-48 sm:h-64 rounded border-2 border-[var(--cyber-cyan)] border-opacity-30 overflow-hidden bg-[var(--bg-dark)]">
              <Image
                src={session.header_image_url}
                alt={session.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Session Name and Info */}
          <div>
            <h1 className="retro-title text-xl sm:text-2xl md:text-3xl font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider break-words">
              {session.name}
            {campaignSessionNumber !== undefined && (
              <span className="ml-3 text-base font-mono uppercase tracking-widest text-[var(--cyber-magenta)]">
                Session #{campaignSessionNumber}
              </span>
            )}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm">
            {session.campaign && (
              <Link 
                href={`/campaigns/${session.campaign.id}`}
                className="text-[var(--cyber-magenta)] hover-cyber font-mono uppercase tracking-wider"
              >
                Campaign: {session.campaign.name}
              </Link>
            )}
            {sessionDateLabel && (
              <span className="inline-block rounded px-[var(--pill-padding-x-medium)] py-[var(--pill-padding-y-medium)] text-xs font-mono uppercase tracking-widest text-[var(--orange-400)] border border-[var(--orange-400)]/40 bg-[var(--bg-dark)]">
                {sessionDateLabel}
              </span>
            )}
          </div>
        </div>

        {/* Session Notes */}
        {session.notes && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[var(--cyber-cyan)] mb-4 uppercase tracking-wider">Session Notes</h3>
            <div className="bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded p-6">
              <div className="text-[var(--text-primary)] whitespace-pre-wrap font-mono text-base sm:text-lg leading-relaxed break-words">
                {renderNotesWithMentions(session.notes, mentionTargets)}
              </div>
            </div>
          </div>
        )}

        {sessionGroups.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[var(--cyber-cyan)] mb-4 uppercase tracking-wider">Related Groups</h3>
            <div className="flex flex-wrap gap-2">
              {sessionGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/organizations/${group.id}`}
                  className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--cyber-magenta)] hover-cyber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
                >
                  {group.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Characters Present */}
        {sessionChars.length > 0 && (
          (() => {
            const sortedCharacters = [...sessionChars].sort((a, b) => {
              const weight = (value: typeof a.player_type) => (value === 'player' ? 0 : value === 'npc' ? 1 : 2)
              const weightDiff = weight(a.player_type) - weight(b.player_type)
              if (weightDiff !== 0) {
                return weightDiff
              }
              return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            })

            return (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[var(--cyber-cyan)] mb-4 uppercase tracking-wider">Related Characters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                  {sortedCharacters.map((character) => (
                    <SessionCharacterCard
                      key={character.id}
                      character={character}
                    />
                  ))}
                </div>
              </div>
            )
          })()
        )}
        </div>
      </div>
    </div>
  )
}
