"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn, formatTimestampForDisplay } from "@/lib/utils";
import { renderNotesWithMentions, type MentionTarget } from "@/lib/mention-utils";
import { IndexEmptyState, IndexHeader } from "@/components/ui/index-utility";

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
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const hasCampaigns = campaigns.length > 0;

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


  return (
    <div className="space-y-4 sm:space-y-6">
      <IndexHeader
        title="Campaigns"
      />

      {!hasCampaigns ? (
        <IndexEmptyState
          title="No campaigns yet"
          description="Create your first campaign to get started."
          actionHref="/campaigns/new"
          actionLabel="Create Campaign"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="relative overflow-hidden rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)] bg-opacity-50 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover-cyber group"
            >
              <Link
                href={`/campaigns/${campaign.id}`}
                className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
                aria-label={`View campaign ${campaign.name}`}
              >
                <span aria-hidden="true" />
              </Link>
              <div className="relative z-10 flex h-full flex-col pointer-events-none">
                <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider transition-colors hover-cyber break-words flex-1">
                    {campaign.name}
                  </h3>
                  <span className="inline-block rounded px-3 py-1 text-xs font-mono uppercase tracking-widest text-[var(--orange-400)] border border-[var(--orange-400)]/40 bg-[var(--bg-dark)] flex-shrink-0">
                    {formatTimestampForDisplay(campaign.created_at) ?? "Unknown"}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:gap-3">
                  {campaign.description && (
                    <div className="pointer-events-auto line-clamp-3 font-mono text-xs sm:text-sm whitespace-pre-wrap break-words text-[var(--text-primary)]">
                      {renderNotesWithMentions(campaign.description, mentionTargets)}
                    </div>
                  )}
                  {campaign.sessions.length > 0 && (
                    <div className="pointer-events-auto">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
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
                            className="inline-flex items-center rounded-full border border-[var(--cyber-cyan)]/70 bg-[var(--cyber-cyan)]/10 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cyber-cyan)] transition hover-cyber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-cyan)] whitespace-nowrap"
                          >
                            {session.name}
                          </Link>
                        ))}
                        {!expandedCampaigns.has(campaign.id) && (campaign.sessionCount ?? campaign.sessions.length) > 3 && (
                          <button
                            onClick={() => toggleCampaignSessions(campaign.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-[var(--cyber-cyan)]/50 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cyber-cyan)] hover-cyber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-cyan)] whitespace-nowrap"
                          >
                            +{(campaign.sessionCount ?? campaign.sessions.length) - 3} more
                          </button>
                        )}
                        {expandedCampaigns.has(campaign.id) && (campaign.sessionCount ?? campaign.sessions.length) > 3 && (
                          <button
                            onClick={() => toggleCampaignSessions(campaign.id)}
                            className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cyber-magenta)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] whitespace-nowrap"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {campaign.organizations.length > 0 && (
                    <div className="pointer-events-auto">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
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
                            className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cyber-magenta)] transition hover-brightness focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] whitespace-nowrap"
                          >
                            {organization.name}
                          </Link>
                        ))}
                        {!expandedGroups.has(campaign.id) && campaign.organizations.length > 6 && (
                          <button
                            onClick={() => toggleCampaignGroups(campaign.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-[var(--cyber-magenta)]/50 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cyber-magenta)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] whitespace-nowrap"
                          >
                            +{campaign.organizations.length - 6} more
                          </button>
                        )}
                        {expandedGroups.has(campaign.id) && campaign.organizations.length > 6 && (
                          <button
                            onClick={() => toggleCampaignGroups(campaign.id)}
                            className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cyber-magenta)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] whitespace-nowrap"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {campaign.characters.length > 0 && (
                    <div className="pointer-events-auto">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
                        Characters
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {campaign.characters.map((character) => (
                          <Link
                            key={`${campaign.id}-char-${character.id}`}
                            href={`/characters/${character.id}`}
                            className={cn(
                              "inline-flex items-center rounded px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2",
                              character.player_type === "player"
                                ? "border border-[var(--cyber-cyan)] border-opacity-40 bg-[var(--bg-dark)] text-[var(--cyber-cyan)] hover-cyber focus-visible:ring-[var(--cyber-cyan)]"
                                : "border border-[var(--cyber-magenta)] border-opacity-40 bg-[var(--bg-card)] text-[var(--cyber-magenta)] hover-cyber focus-visible:ring-[var(--cyber-magenta)]"
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
