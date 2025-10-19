import Link from 'next/link'
import { notFound } from 'next/navigation'
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

  // Fetch organizations linked to this session
  const { data: sessionOrganizations } = await supabase
    .from('organization_sessions')
    .select('organization_id')
    .eq('session_id', id)

  const organizationIds = sessionOrganizations?.map(so => so.organization_id) || []

  // Fetch all campaigns and characters for the form
  const [{ data: campaigns }, { data: allCharacters }, { data: allSessions }, { data: organizations }] = await Promise.all([
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('characters').select(`
      id,
      name,
      race,
      class,
      organization_memberships:organization_characters(
        organizations(id, name)
      )
    `).order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
  ])

  const updateSessionWithId = updateSession.bind(null, id)

  const newCharacterId = typeof query?.newCharacterId === 'string' ? query.newCharacterId : undefined

  // Transform character data to include organizations
  type CharacterRow = {
    id: string
    name: string
    race: string | null
    class: string | null
    organization_memberships: Array<{
      organizations: { id: string; name: string } | Array<{ id: string; name: string }>
    }> | null
  }

  const charactersWithOrgs = (allCharacters as CharacterRow[] | null)?.map((character) => {
    const organizations: Array<{ id: string; name: string }> = []
    
    if (character.organization_memberships) {
      character.organization_memberships.forEach((membership) => {
        const orgData = membership.organizations
        const org = Array.isArray(orgData) ? orgData[0] : orgData
        if (org?.id && org?.name) {
          organizations.push({ id: org.id, name: org.name })
        }
      })
    }

    return {
      id: character.id,
      name: character.name,
      race: character.race,
      class: character.class,
      organizations,
    }
  }) || []

  const mentionTargets = [
    ...charactersWithOrgs
      .filter((entry): entry is { id: string; name: string } => Boolean(entry?.name))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        href: `/characters/${entry.id}`,
        kind: 'character' as const,
      })),
    ...(allSessions ?? [])
      .filter((entry): entry is { id: string; name: string } => Boolean(entry?.name))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        href: `/sessions/${entry.id}`,
        kind: 'session' as const,
      })),
    ...(organizations ?? [])
      .filter((entry): entry is { id: string; name: string } => Boolean(entry?.name))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        href: `/organizations/${entry.id}`,
        kind: 'organization' as const,
      })),
  ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/sessions/${id}`} className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Session
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Edit Session</h2>
      
      <SessionForm
        action={updateSessionWithId}
        initialData={{
          name: session.name,
          campaign_id: session.campaign_id,
          session_date: session.session_date,
          notes: session.notes,
          header_image_url: session.header_image_url,
          characterIds: characterIds,
          organizationIds: organizationIds,
        }}
        campaigns={campaigns || []}
        characters={charactersWithOrgs}
        organizations={organizations || []}
        submitLabel="Save Changes"
        cancelHref={`/sessions/${id}`}
        draftKey={`session-notes:${id}`}
        preselectedCharacterIds={newCharacterId ? [newCharacterId] : undefined}
        mentionTargets={mentionTargets}
      />
    </div>
  )
}
