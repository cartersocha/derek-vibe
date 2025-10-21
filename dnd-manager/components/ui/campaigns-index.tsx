"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatTimestampForDisplay } from "@/lib/utils";
import { renderNotesWithMentions, type MentionTarget } from "@/lib/mention-utils";
import { IndexEmptyState, IndexHeader, IndexSearchEmptyState } from "@/components/ui/index-utility";

type CampaignRecord = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type CampaignsIndexProps = {
  campaigns: CampaignRecord[];
  mentionTargets: MentionTarget[];
};

export function CampaignsIndex({ campaigns, mentionTargets }: CampaignsIndexProps) {
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
      <IndexHeader
        title="Campaigns"
        searchId="campaign-search"
        searchPlaceholder="Search"
        searchValue={query}
        onSearchChange={(event) => setQuery(event.target.value)}
        searchDisabled={!hasCampaigns}
        actionHref="/campaigns/new"
        actionLabel="+ New Campaign"
      />

      {!hasCampaigns ? (
        <IndexEmptyState
          title="No campaigns yet"
          description="Create your first campaign to get started."
          actionHref="/campaigns/new"
          actionLabel="Create Campaign"
        />
      ) : filteredCampaigns.length === 0 ? (
        <IndexSearchEmptyState message="No campaigns matched your search." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="relative overflow-hidden rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e] bg-opacity-50 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50 group"
            >
              <Link
                href={`/campaigns/${campaign.id}`}
                className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                aria-label={`View campaign ${campaign.name}`}
              >
                <span aria-hidden="true" />
              </Link>
              <div className="relative z-10 flex h-full flex-col gap-3 pointer-events-none">
                <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider transition-colors group-hover:text-[#ff00ff]">
                  {campaign.name}
                </h3>
                {campaign.description && (
                  <div className="pointer-events-auto line-clamp-3 font-mono text-sm whitespace-pre-wrap break-words text-[#cbd5f5]">
                    {renderNotesWithMentions(campaign.description, mentionTargets)}
                  </div>
                )}
                <div className="mt-auto font-mono text-xs uppercase tracking-wider text-orange-400">
                  Created {formatTimestampForDisplay(campaign.created_at) ?? "Unknown"}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
