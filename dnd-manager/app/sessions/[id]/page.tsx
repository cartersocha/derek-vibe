import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateSession, deleteSession } from '@/lib/actions/sessions'
import SessionForm from '@/components/forms/session-form'

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

  // Fetch all campaigns and characters for the form
  const [{ data: campaigns }, { data: allCharacters }] = await Promise.all([
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('characters').select('id, name, race, class').order('name'),
  ])

  const updateSessionWithId = updateSession.bind(null, id)
  const deleteSessionWithId = deleteSession.bind(null, id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/sessions" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Sessions
        </Link>
        <form action={deleteSessionWithId}>
          <button
            type="submit"
            className="bg-[#0f0f23] border border-red-500 border-opacity-50 text-red-500 px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-red-500 hover:text-black transition-all duration-200"
          >
            Delete Session
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider mb-6">Edit Session</h2>
        <SessionForm
          action={updateSessionWithId}
          initialData={{
            name: session.name,
            campaign_id: session.campaign_id,
            session_date: session.session_date,
            notes: session.notes,
            header_image_url: session.header_image_url,
            characterIds: characterIds
          }}
          campaigns={campaigns || []}
          characters={allCharacters || []}
          submitLabel="Save Changes"
          cancelHref="/sessions"
        />
      </div>

      {sessionChars.length > 0 && (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6">
          <h3 className="text-lg font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Characters in this Session</h3>
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
  )
}
