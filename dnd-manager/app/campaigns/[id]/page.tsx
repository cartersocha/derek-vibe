import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCampaign, deleteCampaign } from '@/lib/actions/campaigns'

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (!campaign) {
    notFound()
  }

  // Fetch sessions for this campaign
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('campaign_id', id)
    .order('session_date', { ascending: false })

  const updateCampaignWithId = updateCampaign.bind(null, id)
  const deleteCampaignWithId = deleteCampaign.bind(null, id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/campaigns" className="text-blue-600 hover:text-blue-700">
          ← Back to Campaigns
        </Link>
        <form action={deleteCampaignWithId}>
          <button
            type="submit"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Campaign
          </button>
        </form>
      </div>

      <form action={updateCampaignWithId} className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Campaign</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={campaign.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={campaign.description || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </form>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Sessions</h2>
          <Link
            href={`/sessions/new?campaign_id=${id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + Add Session
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <p className="text-gray-600">No sessions yet for this campaign</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">{session.name}</h3>
                  {session.session_date && (
                    <span className="text-sm text-gray-500">
                      {new Date(session.session_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
