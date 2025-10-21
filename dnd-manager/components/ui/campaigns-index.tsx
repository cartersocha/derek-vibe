"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn, formatTimestampForDisplay } from "@/lib/utils";
import { renderNotesWithMentions, type MentionTarget } from "@/lib/mention-utils";
import { IndexEmptyState, IndexHeader, IndexSearchEmptyState } from "@/components/ui/index-utility";

type CampaignRecord = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  organizations: { id: string; name: string }[];
  sessions: { id: string; name: string }[];
  allSessions: { id: string; name: string }[];
  characters: { id: string; name: string; player_type: string | null }[];
  sessionCount?: number;
};

type CampaignsIndexProps = {
  campaigns: CampaignRecord[];
  mentionTargets: MentionTarget[];
};

export function CampaignsIndex({ campaigns, mentionTargets }: CampaignsIndexProps) {
  const [query, setQuery] = useState("");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const hasCampaigns = campaigns.length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  const toggleCampaignSessions = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const toggleCampaignGroups = (campaignId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const filteredCampaigns = useMemo(() => {
    if (!normalizedQuery) {
      return campaigns;
    }

    return campaigns.filter((campaign) => {
      const haystack = [
        campaign.name,
        campaign.description ?? "",
        // Add related sessions to search
        campaign.sessions.map((session) => session.name).join(" "),
        // Add related characters to search
        campaign.characters.map((character) => character.name).join(" "),
        // Add related organizations to search
        campaign.organizations.map((org) => org.name).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [campaigns, normalizedQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
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
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {filteredCampaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="relative overflow-hidden rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e] bg-opacity-50 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50 group"
            >
              <Link
                href={`/campaigns/${campaign.id}`}
                className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                aria-label={`View campaign ${campaign.name}`}
              >
                <span aria-hidden="true" />
              </Link>
              <div className="relative z-10 flex h-full flex-col pointer-events-none">
                <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-[#00ffff] uppercase tracking-wider transition-colors group-hover:text-[#ff00ff] break-words flex-1">
                    {campaign.name}
                  </h3>
                  <span className="text-xs font-mono uppercase tracking-wider text-orange-400 flex-shrink-0">
                    {formatTimestampForDisplay(campaign.created_at) ?? "Unknown"}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:gap-3">
                  {campaign.description && (
                    <div className="pointer-events-auto line-clamp-3 font-mono text-xs sm:text-sm whitespace-pre-wrap break-words text-[#cbd5f5]">
                      {renderNotesWithMentions(campaign.description, mentionTargets)}
                    </div>
                  )}
                  {campaign.sessions.length > 0 && (
                    <div className="pointer-events-auto">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#94a3b8]">
                        Sessions
                      </div>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        {(expandedCampaigns.has(campaign.id) 
                          ? campaign.allSessions 
                          : campaign.sessions
                        ).map((session) => (
                          <Link
                            key={`${campaign.id}-session-${session.id}`}
                            href={`/sessions/${session.id}`}
                            className="inline-flex items-center rounded-full border border-[#00ff88]/70 bg-[#0a1a0f] px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[#00ff88] transition hover:border-[#00cc6a] hover:text-[#00cc6a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] min-h-[24px]"
                          >
                            {session.name}
                          </Link>
                        ))}
                        {!expandedCampaigns.has(campaign.id) && (campaign.sessionCount ?? campaign.sessions.length) > 3 && (
                          <button
                            onClick={() => toggleCampaignSessions(campaign.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-[#00ff88]/50 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[#00ff88] hover:border-[#00cc6a] hover:text-[#00cc6a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] min-h-[24px]"
                          >
                            +{(campaign.sessionCount ?? campaign.sessions.length) - 3} more
                          </button>
                        )}
                        {expandedCampaigns.has(campaign.id) && (campaign.sessionCount ?? campaign.sessions.length) > 3 && (
                          <button
                            onClick={() => toggleCampaignSessions(campaign.id)}
                            className="inline-flex items-center rounded-full border border-[#ff6b35]/70 bg-[#1f1100] px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[#ff6b35] hover:border-[#ff8a5b] hover:text-[#ff8a5b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] min-h-[24px]"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {campaign.organizations.length > 0 && (
                    <div className="pointer-events-auto">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#94a3b8]">
                        Groups
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {(expandedGroups.has(campaign.id) 
                          ? campaign.organizations 
                          : campaign.organizations.slice(0, 6)
                        ).map((organization) => (
                          <Link
                            key={`${campaign.id}-org-${organization.id}`}
                            href={`/organizations/${organization.id}`}
                            className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd447] min-h-[24px]"
                          >
                            {organization.name}
                          </Link>
                        ))}
                        {!expandedGroups.has(campaign.id) && campaign.organizations.length > 6 && (
                          <button
                            onClick={() => toggleCampaignGroups(campaign.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-[#fcee0c]/50 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[#fcee0c] hover:border-[#ffd447] hover:text-[#ffd447] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcee0c] min-h-[24px]"
                          >
                            +{campaign.organizations.length - 6} more
                          </button>
                        )}
                        {expandedGroups.has(campaign.id) && campaign.organizations.length > 6 && (
                          <button
                            onClick={() => toggleCampaignGroups(campaign.id)}
                            className="inline-flex items-center rounded-full border border-[#ff6b35]/70 bg-[#1f1100] px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[#ff6b35] hover:border-[#ff8a5b] hover:text-[#ff8a5b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] min-h-[24px]"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {campaign.characters.length > 0 && (
                    <div className="pointer-events-auto">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#94a3b8]">
                        Characters
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {campaign.characters.map((character) => (
                          <Link
                            key={`${campaign.id}-char-${character.id}`}
                            href={`/characters/${character.id}`}
                            className={cn(
                              "inline-flex items-center rounded px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 min-h-[24px]",
                              character.player_type === "player"
                                ? "border border-[#00ffff] border-opacity-40 bg-[#0f0f23] text-[#00ffff] hover:border-[#00ffff] hover:text-[#ff00ff] focus-visible:ring-[#00ffff]"
                                : "border border-[#ff00ff] border-opacity-40 bg-[#211027] text-[#ff6ad5] hover:border-[#ff6ad5] hover:text-[#ff9de6] focus-visible:ring-[#ff00ff]"
                            )}
                          >
                            {character.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
