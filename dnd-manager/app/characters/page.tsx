import { createClient } from '@/lib/supabase/server'
import { CharacterSearch } from '@/components/ui/character-search'

export default async function CharactersPage() {
  const supabase = await createClient()

  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .order('name', { ascending: true })

  return <CharacterSearch characters={characters ?? []} />
}
