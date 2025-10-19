import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCharacter } from '@/lib/actions/characters'
import CharacterEditForm from '@/components/forms/character-edit-form'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'

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

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(allCharacters, 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(allSessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(organizations, 'organization', (entry) => `/organizations/${entry.id}`)
  )

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
