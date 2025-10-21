import { createClient } from '@/lib/supabase/server'
import { CharacterSearch } from '@/components/ui/character-search'

export default async function CharactersPage() {
  const supabase = await createClient()

  // First, get the basic characters data
  const [charactersResult, organizationMemberCountsResult] = await Promise.all([
    supabase
      .from('characters')
      .select(`
        *,
        organization_characters (
          role,
          organization:organizations (id, name)
        )
      `)
      .order('name', { ascending: true }),
    supabase.from('organization_characters').select('organization_id')
  ])

  const { data: characters, error: charactersError } = charactersResult

  if (charactersError) {
    console.error('Error fetching characters:', charactersError)
    throw new Error(charactersError.message)
  }

  // Process organization member counts
  const organizationMemberCounts = new Map<string, number>()
  organizationMemberCountsResult.data?.forEach(row => {
    const orgId = row.organization_id
    organizationMemberCounts.set(orgId, (organizationMemberCounts.get(orgId) || 0) + 1)
  })

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
        session_date,
        created_at,
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
    // Sort organizations by member count
    const sortedOrganizations = character.organization_characters?.sort((a: any, b: any) => {
      const aCount = organizationMemberCounts.get(a.organization.id) || 0
      const bCount = organizationMemberCounts.get(b.organization.id) || 0
      
      // Sort by member count (descending), then by name (ascending) as tiebreaker
      if (aCount !== bCount) {
        return bCount - aCount
      }
      return a.organization.name.localeCompare(b.organization.name, undefined, { sensitivity: 'base' })
    }) || []
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
            session_date: session?.session_date || null,
            created_at: session?.created_at || null,
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
      organization_characters: sortedOrganizations,
      session_characters: characterSessions,
      campaign_characters: characterCampaigns
    }
  })

  return <CharacterSearch characters={enrichedCharacters} />
}
