"use client";

import { useCampaignFilter } from "@/components/providers/campaign-filter-provider";
import { OrganizationsIndex, type OrganizationRecord } from "@/components/ui/organizations-index";
import { mapEntitiesToMentionTargets, mergeMentionTargets } from "@/lib/mention-utils";

interface OrganizationsContentProps {
  organizations: OrganizationRecord[];
  mentionCharacters: { id: string; name: string }[];
  mentionSessions: { id: string; name: string }[];
  mentionCampaigns: { id: string; name: string }[];
}

export default function OrganizationsContent({
  organizations,
  mentionCharacters,
  mentionSessions,
  mentionCampaigns,
}: OrganizationsContentProps) {
  const { selectedCampaignId, isFilterActive } = useCampaignFilter();

  // Filter organizations based on selected campaign
  const filteredOrganizations = selectedCampaignId 
    ? organizations.filter(organization => {
        // Check if organization is linked to any sessions in the selected campaign
        const hasSessionInCampaign = organization.sessions.some(
          session => session.campaign?.id === selectedCampaignId
        );
        
        // Check if organization is directly linked to the campaign
        const isInCampaign = organization.campaigns.some(
          campaign => campaign.id === selectedCampaignId
        );
        
        return hasSessionInCampaign || isInCampaign;
      })
    : organizations;

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(mentionCharacters, 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(mentionSessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(mentionCampaigns, 'campaign', (entry) => `/campaigns/${entry.id}`)
  );

  return (
    <div className="space-y-6">
      {isFilterActive && (
        <div className="rounded border border-[#ff00ff] border-opacity-30 bg-[#1a1a3e] p-4">
          <p className="text-sm text-[#ff00ff] font-mono uppercase tracking-wider">
            Showing organizations from the selected campaign only
          </p>
        </div>
      )}
      
      <OrganizationsIndex
        organizations={filteredOrganizations}
        mentionTargets={mentionTargets}
      />
    </div>
  );
}
