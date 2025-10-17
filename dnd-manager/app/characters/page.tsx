import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CharactersPage() {
  const supabase = await createClient()

  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Characters</h1>
        <Link
          href="/characters/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Character
        </Link>
      </div>

      {!characters || characters.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No characters yet</h3>
          <p className="text-gray-600 mb-6">Create your first character to get started</p>
          <Link
            href="/characters/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Character
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Link
              key={character.id}
              href={`/characters/${character.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{character.name}</h3>
              <div className="space-y-1 text-sm">
                {character.race && character.class && (
                  <p className="text-gray-600">
                    {character.race} {character.class}
                    {character.level && ` (Level ${character.level})`}
                  </p>
                )}
                {character.backstory && (
                  <p className="text-gray-600 line-clamp-3 mt-2">{character.backstory}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
