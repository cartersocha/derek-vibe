import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteCharacter } from '@/lib/actions/characters'
import { DeleteCharacterButton } from '@/components/ui/delete-character-button'

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

  // Get sessions this character was in
  const { data: sessionCharacters } = await supabase
    .from('session_characters')
    .select('session_id')
    .eq('character_id', id)

  const sessionIds = sessionCharacters?.map(sc => sc.session_id) || []
  
  let sessions: Array<{
    id: string
    name: string
    session_date: string | null
  }> = []

  if (sessionIds.length > 0) {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('id, name, session_date')
      .in('id', sessionIds)
      .order('session_date', { ascending: false })
    
    sessions = sessionData || []
  }

  const deleteCharacterWithId = deleteCharacter.bind(null, id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <Link href="/characters" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Characters
        </Link>
        <div className="flex gap-4">
          <Link
            href={`/characters/${id}/edit`}
            className="bg-[#ff00ff] text-black px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
          >
            Edit Character
          </Link>
          <form action={deleteCharacterWithId}>
            <DeleteCharacterButton />
          </form>
        </div>
      </div>

      <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8 space-y-8">
        {/* Character Portrait */}
        {character.image_url && (
          <div className="relative w-full h-96 rounded border-2 border-[#00ffff] border-opacity-30 overflow-hidden bg-[#0f0f23]">
            <Image
              src={character.image_url}
              alt={character.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Character Name and Basic Info */}
        <div>
          <h1 className="text-4xl font-bold text-[#00ffff] mb-2 uppercase tracking-wider">{character.name}</h1>
          {character.race && character.class && (
            <p className="text-xl text-[#ff00ff] font-mono">
              {character.race} {character.class}
              {character.level && ` • Level ${character.level}`}
            </p>
          )}
        </div>

        {/* Backstory */}
        {character.backstory && (
          <div>
            <h3 className="text-xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Backstory & Notes</h3>
            <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-6">
              <p className="text-gray-300 whitespace-pre-wrap font-mono">{character.backstory}</p>
            </div>
          </div>
        )}

        {/* Sessions */}
        {sessions.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Sessions</h3>
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block p-4 border border-[#00ffff] border-opacity-20 rounded hover:border-[#ff00ff] hover:bg-[#0f0f23] transition-all duration-200"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-[#00ffff] font-mono">{session.name}</h4>
                    {session.session_date && (
                      <span className="text-sm text-gray-400 font-mono uppercase tracking-wider">
                        {new Date(session.session_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
