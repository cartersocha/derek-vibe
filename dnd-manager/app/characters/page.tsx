import { createClient } from '@/lib/supabase/server'
import { CharacterSearch } from '@/components/ui/character-search'

export default async function CharactersPage() {
  const supabase = await createClient()

  // First, get the basic characters data
  const { data: characters, error: charactersError } = await supabase
    .from('characters')
    .select(`
      *,
      organization_characters (
        role,
        organization:organizations (id, name)
      )
    `)
    .order('name', { ascending: true })

  if (charactersError) {
    console.error('Error fetching characters:', charactersError)
    throw new Error(charactersError.message)
  }

  // If no characters, return empty array
  if (!characters || characters.length === 0) {
    return <CharacterSearch characters={[]} />
  }

  // Get character IDs for additional queries
  const characterIds = characters.map(char => char.id)

  // Fetch session relationships
  const { data: sessionRelations } = await supabase
    .from('session_characters')
    .select(`
      character_id,
      session:sessions (
        id,
        name,
        campaign:campaigns (id, name)
      )
    `)
    .in('character_id', characterIds)

  // Fetch campaign relationships
  const { data: campaignRelations } = await supabase
    .from('campaign_characters')
    .select(`
      character_id,
      campaign:campaigns (id, name)
    `)
    .in('character_id', characterIds)

  // Process the data to add session and campaign relationships
  const enrichedCharacters = characters.map(character => {
    const characterSessions = sessionRelations
      ?.filter(rel => rel.character_id === character.id)
      ?.map(rel => {
        // Handle the nested structure from Supabase
        const session = Array.isArray(rel.session) ? rel.session[0] : rel.session
        const campaign = session?.campaign ? (Array.isArray(session.campaign) ? session.campaign[0] : session.campaign) : null
        
        return {
          session: {
            id: session?.id || '',
            name: session?.name || '',
            campaign: campaign ? {
              id: campaign.id || '',
              name: campaign.name || ''
            } : null
          }
        }
      }) || []

    const characterCampaigns = campaignRelations
      ?.filter(rel => rel.character_id === character.id)
      ?.map(rel => {
        // Handle the nested structure from Supabase
        const campaign = Array.isArray(rel.campaign) ? rel.campaign[0] : rel.campaign
        
        return {
          campaign: {
            id: campaign?.id || '',
            name: campaign?.name || ''
          }
        }
      }) || []

    return {
      ...character,
      session_characters: characterSessions,
      campaign_characters: characterCampaigns
    }
  })

  return <CharacterSearch characters={enrichedCharacters} />
}
