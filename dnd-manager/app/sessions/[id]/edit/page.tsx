import Link from 'next/link'
import { notFound } from 'next/navigation'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'
import { createClient } from '@/lib/supabase/server'
import { updateSession } from '@/lib/actions/sessions'
import SessionForm from '@/components/forms/session-form'

export default async function SessionEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const query = await searchParams
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

  // Fetch characters for this session
  const { data: sessionCharacters } = await supabase
    .from('session_characters')
    .select('character_id')
    .eq('session_id', id)

  const characterIds = sessionCharacters?.map(sc => sc.character_id) || []

  // Fetch groups linked to this session
  const { data: sessionGroups } = await supabase
    .from('group_sessions')
    .select('group_id')
    .eq('session_id', id)

  const groupIds = sessionGroups?.map(so => so.group_id) || []

  // Fetch all campaigns and characters for the form
  const [{ data: campaigns }, { data: allCharacters }, { data: allSessions }, { data: groups }] = await Promise.all([
    supabase.from('campaigns').select('id, name, created_at').order('created_at', { ascending: false }),
    supabase.from('characters').select(`
      id,
      name,
      race,
      class,
      group_memberships:group_characters(
        groups(id, name)
      )
    `).order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('groups').select('id, name').order('name'),
  ])

  const updateSessionWithId = updateSession.bind(null, id)

  const newCharacterId = typeof query?.newCharacterId === 'string' ? query.newCharacterId : undefined

  // Transform character data to include groups
  type CharacterRow = {
    id: string
    name: string
    race: string | null
    class: string | null
    group_memberships: Array<{
      groups: { id: string; name: string } | Array<{ id: string; name: string }>
    }> | null
  }

  const charactersWithOrgs = (allCharacters as CharacterRow[] | null)?.map((character) => {
    const groups: Array<{ id: string; name: string }> = []
    
    if (character.group_memberships) {
      character.group_memberships.forEach((membership) => {
        const orgData = membership.groups
        const org = Array.isArray(orgData) ? orgData[0] : orgData
        if (org?.id && org?.name) {
          groups.push({ id: org.id, name: org.name })
        }
      })
    }

    return {
      id: character.id,
      name: character.name,
      race: character.race,
      class: character.class,
      groups,
    }
  }) || []

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersWithOrgs, 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(allSessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(groups, 'group', (entry) => `/groups/${entry.id}`),
    mapEntitiesToMentionTargets(campaigns, 'campaign', (entry) => `/campaigns/${entry.id}`)
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/sessions/${id}`} className="text-[var(--cyber-cyan)] hover:text-[var(--cyber-magenta)] font-mono uppercase tracking-wider">
          ← Back to Session
        </Link>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider break-words">Edit Session</h2>
      
      <SessionForm
        action={updateSessionWithId}
        initialData={{
          name: session.name,
          campaign_id: session.campaign_id,
          session_date: session.session_date,
          notes: session.notes,
          header_image_url: session.header_image_url,
          characterIds: characterIds,
          groupIds: groupIds,
        }}
        campaigns={campaigns || []}
        characters={charactersWithOrgs}
        groups={groups || []}
        submitLabel="Save Changes"
        cancelHref={`/sessions/${id}`}
        draftKey={`session-notes:${id}`}
        preselectedCharacterIds={newCharacterId ? [newCharacterId] : undefined}
        mentionTargets={mentionTargets}
      />
    </div>
  )
}
