import { createSession } from '@/lib/actions/sessions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [{ data: campaigns }, { data: characters }] = await Promise.all([
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('characters').select('id, name, race, class').order('name'),
  ])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Session</h1>
        <p className="mt-2 text-gray-600">Record a new game session</p>
      </div>

      <form action={createSession} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Session Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter session name"
          />
        </div>

        <div>
          <label htmlFor="campaign_id" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign (Optional)
          </label>
          <select
            id="campaign_id"
            name="campaign_id"
            defaultValue={params.campaign_id || ''}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What happened in this session..."
          />
        </div>

        {characters && characters.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Characters Present
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4">
              {characters.map((character) => (
                <label key={character.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="character_ids"
                    value={character.id}
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

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Session
          </button>
          <Link
            href="/sessions"
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
