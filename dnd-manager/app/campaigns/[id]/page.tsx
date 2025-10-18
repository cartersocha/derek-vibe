import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteCampaign } from '@/lib/actions/campaigns'
import { DeleteCampaignButton } from '@/components/ui/delete-campaign-button'

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
    .order('session_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const deleteCampaignWithId = deleteCampaign.bind(null, id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/campaigns" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Campaigns
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={`/campaigns/${id}/edit`}
            className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            Edit Campaign
          </Link>
          <form action={deleteCampaignWithId}>
            <DeleteCampaignButton />
          </form>
        </div>
      </div>

      <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8 space-y-8">
        {/* Campaign Name and Description */}
        <div>
          <h1 className="text-4xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">{campaign.name}</h1>
          {campaign.description && (
            <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-6">
              <p className="text-gray-300 whitespace-pre-wrap font-mono">{campaign.description}</p>
            </div>
          )}
        </div>

        {/* Campaign Stats */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Sessions</div>
            <div className="text-3xl font-bold text-[#00ffff]">{sessions?.length || 0}</div>
          </div>
          <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Created</div>
            <div className="text-lg font-bold text-[#00ffff]">
              {new Date(campaign.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
          <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last Updated</div>
            <div className="text-lg font-bold text-[#00ffff]">
              {new Date(campaign.updated_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Sessions</h2>
            <Link
              href={`/sessions/new?campaign_id=${id}`}
              className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:text-base sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 text-sm shadow-lg shadow-[#ff00ff]/50 text-center"
            >
              + Add Session
            </Link>
          </div>

          {!sessions || sessions.length === 0 ? (
            <div className="bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded p-8 text-center">
              <p className="text-gray-400 font-mono mb-4">No sessions yet for this campaign</p>
              <Link
                href={`/sessions/new?campaign_id=${id}`}
                className="inline-block w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
              >
                Create First Session
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block p-4 border border-[#00ffff] border-opacity-20 rounded hover:border-[#ff00ff] hover:bg-[#0f0f23] transition-all duration-200"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-[#00ffff] font-mono mb-1">{session.name}</h3>
                      {session.notes && (
                        <p className="text-sm text-gray-400 line-clamp-2 font-mono">{session.notes}</p>
                      )}
                    </div>
                    {session.session_date && (
                      <span className="text-sm text-gray-400 font-mono uppercase tracking-wider sm:ml-4">
                        {new Date(session.session_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
