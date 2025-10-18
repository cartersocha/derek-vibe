import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCharacter, deleteCharacter } from '@/lib/actions/characters'
import CharacterEditForm from '@/components/forms/character-edit-form'

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
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
  const deleteCharacterWithId = deleteCharacter.bind(null, id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <Link href="/characters" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Characters
        </Link>
        <form action={deleteCharacterWithId}>
          <button
            type="submit"
            className="bg-[#0f0f23] border border-red-500 border-opacity-50 text-red-500 px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-red-500 hover:text-black transition-all duration-200"
          >
            Delete Character
          </button>
        </form>
      </div>

      <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Edit Character</h2>
      
      <CharacterEditForm
        action={updateCharacterWithId}
        character={character}
      />
    </div>
  )
}
