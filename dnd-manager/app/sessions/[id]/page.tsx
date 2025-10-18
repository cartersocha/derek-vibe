import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteSession } from '@/lib/actions/sessions'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select(`
      *,
      campaign:campaigns(id, name)
    `)
    .eq('id', id)
    .single()

  if (!session) {
    notFound()
  }

  // Fetch characters for this session
  const { data: sessionCharacters } = await supabase
    .from('session_characters')
    .select('character_id')
    .eq('session_id', id)

  const characterIds = sessionCharacters?.map(sc => sc.character_id) || []
  
  let sessionChars: Array<{
    id: string
    name: string
    race: string | null
    class: string | null
    level: number | null
  }> = []

  if (characterIds.length > 0) {
    const { data: charData } = await supabase
      .from('characters')
      .select('id, name, race, class, level')
      .in('id', characterIds)
    
    sessionChars = charData || []
  }

  const deleteSessionWithId = deleteSession.bind(null, id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <Link href="/sessions" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Sessions
        </Link>
        <div className="flex gap-4">
          <Link
            href={`/sessions/${id}/edit`}
            className="bg-[#ff00ff] text-black px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
          >
            Edit Session
          </Link>
          <form action={deleteSessionWithId}>
            <button
              type="submit"
              className="bg-[#0f0f23] border border-red-500 border-opacity-50 text-red-500 px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-red-500 hover:text-black transition-all duration-200"
              onClick={(e) => {
                if (!confirm('Are you sure you want to delete this session?')) {
                  e.preventDefault()
                }
              }}
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8 space-y-8">
        {/* Header Image */}
        {session.header_image_url && (
          <div className="relative w-full h-64 rounded border-2 border-[#00ffff] border-opacity-30 overflow-hidden bg-[#0f0f23]">
            <Image
              src={session.header_image_url}
              alt={session.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Session Name and Info */}
        <div>
          <h1 className="text-4xl font-bold text-[#00ffff] mb-2 uppercase tracking-wider">{session.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm">
            {session.campaign && (
              <Link 
                href={`/campaigns/${session.campaign.id}`}
                className="text-[#ff00ff] hover:text-[#cc00cc] font-mono uppercase tracking-wider"
              >
                Campaign: {session.campaign.name}
              </Link>
            )}
            {session.session_date && (
              <span className="text-gray-400 font-mono uppercase tracking-wider">
                Date: {new Date(session.session_date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            )}
          </div>
        </div>

        {/* Session Notes */}
        {session.notes && (
          <div>
            <h3 className="text-xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Session Notes</h3>
            <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-6">
              <p className="text-gray-300 whitespace-pre-wrap font-mono">{session.notes}</p>
            </div>
          </div>
        )}

        {/* Characters Present */}
        {sessionChars.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Characters Present</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessionChars.map((character) => (
                <Link
                  key={character.id}
                  href={`/characters/${character.id}`}
                  className="p-4 border border-[#00ffff] border-opacity-20 rounded hover:border-[#ff00ff] hover:bg-[#0f0f23] transition-all duration-200"
                >
                  <h4 className="font-medium text-[#00ffff] font-mono">{character.name}</h4>
                  {character.race && character.class && (
                    <p className="text-sm text-gray-400 font-mono">
                      {character.race} {character.class}
                      {character.level && ` (Level ${character.level})`}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
