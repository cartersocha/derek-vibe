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
    { data: locationRows },
    { data: raceRows },
    { data: classRows },
  ] = await Promise.all([
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
    supabase
      .from('organization_characters')
      .select('organization_id, role')
      .eq('character_id', id),
    supabase
      .from('characters')
      .select('last_known_location')
      .not('last_known_location', 'is', null)
      .neq('last_known_location', ''),
    supabase
      .from('characters')
      .select('race')
      .not('race', 'is', null)
      .neq('race', ''),
    supabase
      .from('characters')
      .select('class')
      .not('class', 'is', null)
      .neq('class', ''),
  ])

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(allCharacters, 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(allSessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(organizations, 'organization', (entry) => `/organizations/${entry.id}`)
  )

  const updateCharacterWithId = updateCharacter.bind(null, id)
  const locationSuggestions =
    (locationRows ?? [])
      .map((entry) => entry.last_known_location)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  const raceSuggestions =
    (raceRows ?? [])
      .map((entry) => entry.race)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
  const classSuggestions =
    (classRows ?? [])
      .map((entry) => entry.class)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/characters/${id}`} className="text-[var(--cyber-cyan)] hover:text-[var(--cyber-magenta)] font-mono uppercase tracking-wider">
          ← Back to Character
        </Link>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider break-words">Edit Character</h2>
      
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
        locationSuggestions={locationSuggestions}
        raceSuggestions={raceSuggestions}
        classSuggestions={classSuggestions}
      />
    </div>
  )
}
