import { createClient } from '@/lib/supabase/server'
import { CharacterCard } from '@/components/ui/character-card'

export const runtime = 'edge'
export const revalidate = 300
export const fetchCache = 'force-cache'

export default async function CharactersPage() {
  const supabase = await createClient()

  // Fetch basic character data first
  const { data: characters, error } = await supabase
            .from('characters')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching characters:', error)
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="retro-title text-base sm:text-lg md:text-xl font-bold text-[var(--cyber-cyan)] break-words">Characters</h1>
        </div>
        <div className="text-[var(--cyber-cyan)]">Error loading characters. Please try again.</div>
      </div>
    )
  }

  // If no characters, show empty state
  if (!characters || characters.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="retro-title text-base sm:text-lg md:text-xl font-bold text-[var(--cyber-cyan)] break-words">Characters</h1>
        </div>
        <div className="text-[var(--cyber-cyan)]">No characters found.</div>
      </div>
    )
  }

  // Get character IDs for relationship queries
  const characterIds = characters.map(char => char.id)

  // Fetch relationships in parallel (following the pattern from other pages)
  const [orgsResult, sessionsResult, campaignsResult] = await Promise.all([
    supabase
      .from('organization_characters')
      .select(`
        character_id,
        role,
        organization:organizations (id, name)
      `)
      .in('character_id', characterIds),
    supabase
      .from('session_characters')
      .select(`
        character_id,
        session:sessions (id, name, campaign_id, session_date, created_at)
      `)
      .in('character_id', characterIds),
    supabase
      .from('campaign_characters')
      .select(`
        character_id,
        campaign:campaigns (id, name)
      `)
      .in('character_id', characterIds)
  ])

  // Process the data with relationships
  const processedCharacters = characters.map(character => {
    const characterOrgs = orgsResult.data?.filter(org => org.character_id === character.id) || [];
    const characterSessions = sessionsResult.data?.filter(sess => sess.character_id === character.id) || [];
    const characterCampaigns = campaignsResult.data?.filter(camp => camp.character_id === character.id) || [];

    return {
      ...character,
      organization_characters: characterOrgs.sort((a: any, b: any) => {
        const nameA = a.organization?.name || '';
        const nameB = b.organization?.name || '';
        return nameA.localeCompare(nameB);
      }),
      session_characters: characterSessions.map((s: any) => s.session),
      campaign_characters: characterCampaigns.map((c: any) => c.campaign)
    };
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="retro-title text-base sm:text-lg md:text-xl font-bold text-[var(--cyber-cyan)] break-words">Characters</h1>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {processedCharacters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
          />
        ))}
      </div>
    </div>
  )
}