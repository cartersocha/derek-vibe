import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateSession, deleteSession } from '@/lib/actions/sessions'

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
  
  let characters: Array<{
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
    
    characters = charData || []
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
        <Link href="/sessions" className="text-blue-600 hover:text-blue-700">
          ← Back to Sessions
        </Link>
        <form action={deleteSessionWithId}>
          <button
            type="submit"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Session
          </button>
        </form>
      </div>

      <form action={updateSessionWithId} className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Session</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Session Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={session.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="campaign_id" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign (Optional)
          </label>
          <select
            id="campaign_id"
            name="campaign_id"
            defaultValue={session.campaign_id || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No campaign</option>
            {campaigns?.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="session_date" className="block text-sm font-medium text-gray-700 mb-2">
            Session Date
          </label>
          <input
            type="date"
            id="session_date"
            name="session_date"
            defaultValue={session.session_date || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Session Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={8}
            defaultValue={session.notes || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {allCharacters && allCharacters.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Characters Present
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {allCharacters.map((character) => (
                <label key={character.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="character_ids"
                    value={character.id}
                    defaultChecked={characters.some(c => c.id === character.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-900">
                    {character.name}
                    {character.race && character.class && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({character.race} {character.class})
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </form>

      {characters.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Characters in this Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((character) => (
              <Link
                key={character.id}
                href={`/characters/${character.id}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <h4 className="font-medium text-gray-900">{character.name}</h4>
                {character.race && character.class && (
                  <p className="text-sm text-gray-600">
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
