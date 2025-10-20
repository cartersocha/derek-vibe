import { createClient } from '@/lib/supabase/server'
import { NewCharacterForm } from '@/components/forms/new-character-form'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'

type NewCharacterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function NewCharacterPage({ searchParams }: NewCharacterPageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const [
    { data: allCharacters },
    { data: allSessions },
    { data: organizations },
    { data: locationRows },
    { data: raceRows },
    { data: classRows },
  ] = await Promise.all([
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
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

  const redirectValue = params?.redirectTo
  const redirectTo = Array.isArray(redirectValue) ? redirectValue[0] ?? null : redirectValue ?? null
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="retro-title text-3xl font-bold text-[#00ffff]">Create New Character</h1>
      </div>

      <NewCharacterForm
        redirectTo={redirectTo}
        mentionTargets={mentionTargets}
        organizations={(organizations ?? []).map((organization) => ({
          id: organization.id,
          name: organization.name ?? 'Untitled Organization',
        }))}
        locationSuggestions={locationSuggestions}
        raceSuggestions={raceSuggestions}
        classSuggestions={classSuggestions}
      />
    </div>
  )
}
