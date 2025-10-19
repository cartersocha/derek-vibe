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

  // Fetch all campaigns and characters for the form
  const [{ data: campaigns }, { data: allCharacters }, { data: allSessions }, { data: organizations }] = await Promise.all([
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('characters').select('id, name, race, class').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
  ])

  const updateSessionWithId = updateSession.bind(null, id)

  const newCharacterId = typeof query?.newCharacterId === 'string' ? query.newCharacterId : undefined

  const sessionQuery = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (key === 'newCharacterId') {
        return
      }
      if (typeof value === 'string') {
        sessionQuery.set(key, value)
      }
    })
  }

  const sessionPath = `/sessions/${id}/edit${sessionQuery.toString() ? `?${sessionQuery.toString()}` : ''}`
  const newCharacterHref = `/characters/new?${new URLSearchParams({ redirectTo: sessionPath }).toString()}`

  const mentionTargets = [
    ...(allCharacters ?? [])
      .filter((entry): entry is { id: string; name: string; race: string | null; class: string | null } => Boolean(entry?.name))
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
          characterIds: characterIds
        }}
        campaigns={campaigns || []}
        characters={allCharacters || []}
        submitLabel="Save Changes"
        cancelHref={`/sessions/${id}`}
        draftKey={`session-notes:${id}`}
        newCharacterHref={newCharacterHref}
        preselectedCharacterIds={newCharacterId ? [newCharacterId] : undefined}
        mentionTargets={mentionTargets}
      />
    </div>
  )
}
