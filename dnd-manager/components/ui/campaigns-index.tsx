"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatTimestampForDisplay } from "@/lib/utils";

type CampaignRecord = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type CampaignsIndexProps = {
  campaigns: CampaignRecord[];
};

export function CampaignsIndex({ campaigns }: CampaignsIndexProps) {
  const [query, setQuery] = useState("");

  const hasCampaigns = campaigns.length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCampaigns = useMemo(() => {
    if (!normalizedQuery) {
      return campaigns;
    }

    return campaigns.filter((campaign) => {
      const haystack = [campaign.name, campaign.description ?? ""].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [campaigns, normalizedQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="retro-title text-3xl font-bold text-[#00ffff]">Campaigns</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <label className="sr-only" htmlFor="campaign-search">
            Search campaigns
          </label>
          <input
            id="campaign-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            type="search"
            disabled={!hasCampaigns}
            className="h-9 w-full rounded border border-[#00ffff] border-opacity-40 bg-[#0f0f23] px-3 font-mono text-xs uppercase tracking-wider text-[#00ffff] placeholder:text-[#00ffff]/60 focus:border-[#ff00ff] focus:outline-none focus:ring-1 focus:ring-[#ff00ff] disabled:border-opacity-20 disabled:text-[#00ffff]/40 sm:w-52"
          />
          <Link
            href="/campaigns/new"
            className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-xs sm:text-sm sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            + New Campaign
          </Link>
        </div>
      </div>

      {!hasCampaigns ? (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-12 text-center">
          <h3 className="text-lg font-medium text-[#00ffff] mb-2 uppercase tracking-wider">No campaigns yet</h3>
          <p className="text-gray-400 mb-6 font-mono">Create your first campaign to get started</p>
          <Link
            href="/campaigns/new"
            className="inline-block w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            Create Campaign
          </Link>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="rounded border border-dashed border-[#00ffff]/40 bg-[#0f0f23]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#00ffff]/70">No campaigns matched your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50 transition-all duration-200 group"
            >
              <h3 className="text-xl font-bold text-[#00ffff] mb-2 uppercase tracking-wider group-hover:text-[#ff00ff] transition-colors">
                {campaign.name}
              </h3>
              {campaign.description && (
                <p className="text-gray-400 line-clamp-3 font-mono text-sm">{campaign.description}</p>
              )}
              <div className="mt-4 text-xs text-orange-500 font-mono uppercase tracking-wider">
                Created {formatTimestampForDisplay(campaign.created_at) ?? "Unknown"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
