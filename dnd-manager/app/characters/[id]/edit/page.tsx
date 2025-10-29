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
    { data: groups },
    { data: campaigns },
    { data: groupLinks },
    { data: campaignLinks },
    { data: sessionDerivedCampaigns },
    { data: locationRows },
    { data: raceRows },
    { data: classRows },
  ] = await Promise.all([
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('groups').select('id, name').order('name'),
    supabase.from('campaigns').select('id, name').order('name'),
    supabase
      .from('group_characters')
      .select('group_id, role')
      .eq('character_id', id),
    supabase
      .from('campaign_characters')
      .select('campaign_id')
      .eq('character_id', id),
    supabase
      .from('sessions')
      .select('campaign_id, session_characters!inner(character_id)')
      .eq('session_characters.character_id', id),
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
    mapEntitiesToMentionTargets(groups, 'group', (entry) => `/groups/${entry.id}`)
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
        groups={(groups ?? []).map((group) => ({
          id: group.id,
          name: group.name ?? 'Untitled Group',
        }))}
        campaigns={(campaigns ?? []).map((campaign) => ({
          id: campaign.id,
          name: campaign.name ?? 'Untitled Campaign',
        }))}
        groupAffiliations={(groupLinks ?? []).map((entry) => entry.group_id)}
        campaignAffiliations={Array.from(new Set([
          ...((campaignLinks ?? []).map((entry) => entry.campaign_id).filter(Boolean) as string[]),
          ...((sessionDerivedCampaigns ?? []).map((row) => row.campaign_id).filter(Boolean) as string[]),
        ]))}
        locationSuggestions={locationSuggestions}
        raceSuggestions={raceSuggestions}
        classSuggestions={classSuggestions}
      />
    </div>
  )
}
