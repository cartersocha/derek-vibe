import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCharacter } from '@/lib/actions/characters'
import CharacterEditForm from '@/components/forms/character-edit-form'

export default async function CharacterEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (!character) {
    notFound()
  }

  const [
    { data: allCharacters },
    { data: allSessions },
    { data: organizations },
    { data: organizationLinks },
  ] = await Promise.all([
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
    supabase
      .from('organization_characters')
      .select('organization_id, role')
      .eq('character_id', id),
  ])

  const mentionTargets = [
    ...(allCharacters ?? [])
      .flatMap((entry) => {
        if (!entry?.id || !entry?.name) {
          return []
        }
        return [{
          id: entry.id as string,
          name: entry.name as string,
          href: `/characters/${entry.id}`,
          kind: 'character' as const,
        }]
      }),
    ...(allSessions ?? [])
      .flatMap((entry) => {
        if (!entry?.id || !entry?.name) {
          return []
        }
        return [{
          id: entry.id as string,
          name: entry.name as string,
          href: `/sessions/${entry.id}`,
          kind: 'session' as const,
        }]
      }),
    ...(organizations ?? [])
      .flatMap((entry) => {
        if (!entry?.id || !entry?.name) {
          return []
        }
        return [{
          id: entry.id as string,
          name: entry.name as string,
          href: `/organizations/${entry.id}`,
          kind: 'organization' as const,
        }]
      }),
  ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  const updateCharacterWithId = updateCharacter.bind(null, id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/characters/${id}`} className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Character
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Edit Character</h2>
      
      <CharacterEditForm
        action={updateCharacterWithId}
        character={character}
        cancelHref={`/characters/${id}`}
        mentionTargets={mentionTargets}
        organizations={(organizations ?? []).map((organization) => ({
          id: organization.id,
          name: organization.name ?? 'Untitled Organization',
        }))}
        organizationAffiliations={(organizationLinks ?? []).map((entry) => entry.organization_id)}
      />
    </div>
  )
}
