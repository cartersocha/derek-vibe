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
        <Link href="/campaigns" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Campaigns
        </Link>
        <form action={deleteCampaignWithId}>
          <button
            type="submit"
            className="bg-[#0f0f23] border border-red-500 border-opacity-50 text-red-500 px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-red-500 hover:text-black transition-all duration-200"
          >
            Delete Campaign
          </button>
        </form>
      </div>

      <form action={updateCampaignWithId} className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 space-y-6">
        <h2 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">Edit Campaign</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Campaign Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={campaign.name}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={campaign.description || ''}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#ff00ff] text-black px-4 py-3 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
        >
          Save Changes
        </button>
      </form>

      <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Sessions</h2>
          <Link
            href={`/sessions/new?campaign_id=${id}`}
            className="bg-[#ff00ff] text-black px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 text-sm shadow-lg shadow-[#ff00ff]/50"
          >
            + Add Session
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <p className="text-gray-400 font-mono">No sessions yet for this campaign</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block p-4 border border-[#00ffff] border-opacity-20 rounded hover:border-[#ff00ff] hover:bg-[#0f0f23] transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-[#00ffff] font-mono">{session.name}</h3>
                  {session.session_date && (
                    <span className="text-sm text-gray-400 font-mono uppercase tracking-wider">
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
