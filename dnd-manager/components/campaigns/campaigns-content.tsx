"use client";

import { useCampaignFilter } from "@/components/providers/campaign-filter-provider";
import { CampaignsIndex } from "@/components/ui/campaigns-index";
import { mapEntitiesToMentionTargets, mergeMentionTargets } from "@/lib/mention-utils";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  characters: Array<{
    campaign_id: string;
    character: {
      id: string;
      name: string;
      player_type: string;
    };
  }>;
  organizations: Array<{
    campaign_id: string;
    organization: {
      id: string;
      name: string;
    };
  }>;
  sessions: Array<{
    id: string;
    name: string;
    campaign_id: string;
    session_date: string | null;
    created_at: string;
  }>;
}

interface CampaignsContentProps {
  campaigns: Campaign[];
  mentionCharacters: { id: string; name: string }[];
  mentionSessions: { id: string; name: string }[];
  mentionOrganizations: { id: string; name: string }[];
  organizationMemberCounts: Map<string, number>;
}

export default function CampaignsContent({
  campaigns,
  mentionCharacters,
  mentionSessions,
  mentionOrganizations,
  organizationMemberCounts,
}: CampaignsContentProps) {
  const { selectedCampaignId, isFilterActive } = useCampaignFilter();

  // Filter campaigns based on selected campaign
  const filteredCampaigns = selectedCampaignId 
    ? campaigns.filter(campaign => campaign.id === selectedCampaignId)
    : campaigns;

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(mentionCharacters, 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(mentionSessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(mentionOrganizations, 'organization', (entry) => `/organizations/${entry.id}`)
  );

  return (
    <div className="space-y-6">
      {isFilterActive && (
        <div className="rounded border border-[#ff00ff] border-opacity-30 bg-[#1a1a3e] p-4">
          <p className="text-sm text-[#ff00ff] font-mono uppercase tracking-wider">
            Showing only the selected campaign
          </p>
        </div>
      )}
      
      <CampaignsIndex
        campaigns={filteredCampaigns}
        mentionTargets={mentionTargets}
        organizationMemberCounts={organizationMemberCounts}
      />
    </div>
  );
}
