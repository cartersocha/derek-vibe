import { createCampaign } from '@/lib/actions/campaigns'
import Link from 'next/link'

export default function NewCampaignPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Create New Campaign</h1>
        <p className="mt-2 text-gray-400 font-mono">Start a new adventure</p>
      </div>

      <form action={createCampaign} className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Campaign Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            placeholder="Enter campaign name"
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
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            placeholder="Describe your campaign..."
            spellCheck
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            className="flex-1 bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-5 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
          >
            Create Campaign
          </button>
          <Link
            href="/campaigns"
            className="flex-1 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] px-4 py-2 text-sm sm:px-5 sm:py-3 sm:text-base rounded hover:border-[#ff00ff] hover:text-[#ff00ff] transition-all duration-200 text-center font-bold uppercase tracking-wider"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
