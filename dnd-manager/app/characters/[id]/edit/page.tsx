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

  const updateCharacterWithId = updateCharacter.bind(null, id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <Link href={`/characters/${id}`} className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Character
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Edit Character</h2>
      
      <CharacterEditForm
        action={updateCharacterWithId}
        character={character}
        cancelHref={`/characters/${id}`}
      />
    </div>
  )
}
