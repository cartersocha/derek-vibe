import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="bg-[#ff00ff] text-black px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
        >
          + New Campaign
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-12 text-center">
          <h3 className="text-lg font-medium text-[#00ffff] mb-2 uppercase tracking-wider">No campaigns yet</h3>
          <p className="text-gray-400 mb-6 font-mono">Create your first campaign to get started</p>
          <Link
            href="/campaigns/new"
            className="inline-block bg-[#ff00ff] text-black px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
          >
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50 transition-all duration-200 group"
            >
              <h3 className="text-xl font-bold text-[#00ffff] mb-2 uppercase tracking-wider group-hover:text-[#ff00ff] transition-colors">{campaign.name}</h3>
              {campaign.description && (
                <p className="text-gray-400 line-clamp-3 font-mono text-sm">{campaign.description}</p>
              )}
              <div className="mt-4 text-xs text-gray-500 font-mono uppercase tracking-wider">
                Created {new Date(campaign.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
