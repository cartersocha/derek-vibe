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
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Characters</h1>
        <Link
          href="/characters/new"
          className="bg-[#ff00ff] text-black px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
        >
          + New Character
        </Link>
      </div>

      {!characters || characters.length === 0 ? (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-12 text-center">
          <h3 className="text-lg font-medium text-[#00ffff] mb-2 uppercase tracking-wider">No characters yet</h3>
          <p className="text-gray-400 mb-6 font-mono">Create your first character to get started</p>
          <Link
            href="/characters/new"
            className="inline-block bg-[#ff00ff] text-black px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
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
              className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50 transition-all duration-200 group"
            >
              <h3 className="text-xl font-bold text-[#00ffff] mb-2 uppercase tracking-wider group-hover:text-[#ff00ff] transition-colors">{character.name}</h3>
              <div className="space-y-1 text-sm">
                {character.race && character.class && (
                  <p className="text-gray-400 font-mono">
                    {character.race} {character.class}
                    {character.level && ` (Level ${character.level})`}
                  </p>
                )}
                {character.backstory && (
                  <p className="text-gray-500 line-clamp-3 mt-2 font-mono text-xs">{character.backstory}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
