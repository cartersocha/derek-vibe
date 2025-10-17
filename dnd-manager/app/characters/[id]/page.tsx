import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCharacter, deleteCharacter } from '@/lib/actions/characters'

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/characters" className="text-blue-600 hover:text-blue-700">
          ← Back to Characters
        </Link>
        <form action={deleteCharacterWithId}>
          <button
            type="submit"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Character
          </button>
        </form>
      </div>

      <form action={updateCharacterWithId} className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Character</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Character Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={character.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="race" className="block text-sm font-medium text-gray-700 mb-2">
              Race
            </label>
            <input
              type="text"
              id="race"
              name="race"
              defaultValue={character.race || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <input
              type="text"
              id="class"
              name="class"
              defaultValue={character.class || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <input
              type="number"
              id="level"
              name="level"
              min="1"
              max="20"
              defaultValue={character.level || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="backstory" className="block text-sm font-medium text-gray-700 mb-2">
            Backstory
          </label>
          <textarea
            id="backstory"
            name="backstory"
            rows={4}
            defaultValue={character.backstory || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ability Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((ability) => (
              <div key={ability}>
                <label htmlFor={ability} className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {ability}
                </label>
                <input
                  type="number"
                  id={ability}
                  name={ability}
                  min="1"
                  max="30"
                  defaultValue={character[ability] || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </form>
    </div>
  )
}
