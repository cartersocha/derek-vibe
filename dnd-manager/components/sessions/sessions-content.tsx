"use client";

import { useCampaignFilter } from "@/components/providers/campaign-filter-provider";
import { SessionsIndex } from "@/components/ui/sessions-index";
import { type MentionTarget } from "@/lib/mention-utils";
import { extractPlayerSummaries, dateStringToLocalDate, type SessionCharacterRelation } from "@/lib/utils";

interface Session {
  id: string;
  name: string;
  session_date: string | null;
  created_at: string;
  campaign_id: string | null;
  notes: string | null;
  campaign: { id: string; name: string } | null;
  session_characters: SessionCharacterRelation[];
  session_organizations: Array<{
    organization: { id: string; name: string } | { id: string; name: string }[] | null;
  }>;
}

interface SessionsContentProps {
  sessions: Session[];
  mentionCharacters: { id: string; name: string }[];
  organizations: { id: string; name: string }[];
  campaigns: { id: string; name: string }[];
  organizationMemberCounts: Map<string, number>;
}

export default function SessionsContent({
  sessions,
  mentionCharacters,
  organizations,
  campaigns,
  organizationMemberCounts,
}: SessionsContentProps) {
  const { selectedCampaignId, isFilterActive } = useCampaignFilter();

  // Filter sessions based on selected campaign
  const filteredSessions = selectedCampaignId 
    ? sessions.filter(session => session.campaign_id === selectedCampaignId)
    : sessions;

  const sessionNumberMap = new Map<string, number>();

  if (filteredSessions.length > 0) {
    // Group sessions by campaign so we can assign per-campaign sequence numbers
    type SessionWithCampaign = typeof filteredSessions extends (infer S)[] ? S : never;
    const sessionsByCampaign = new Map<string, SessionWithCampaign[]>();

    for (const session of filteredSessions) {
      if (!session.campaign_id) {
        continue;
      }
      const bucket = sessionsByCampaign.get(session.campaign_id) ?? [];
      bucket.push(session);
      sessionsByCampaign.set(session.campaign_id, bucket);
    }

    for (const [, campaignSessions] of sessionsByCampaign) {
      campaignSessions.sort((a, b) => {
        const aDate = dateStringToLocalDate(a.session_date);
        const bDate = dateStringToLocalDate(b.session_date);
        const aTime = aDate ? aDate.getTime() : Number.POSITIVE_INFINITY;
        const bTime = bDate ? bDate.getTime() : Number.POSITIVE_INFINITY;
        if (aTime === bTime) {
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
          return aCreated - bCreated;
        }
        return aTime - bTime;
      });

      let counter = 1;
      for (const session of campaignSessions) {
        if (!session.session_date) {
          continue;
        }
        sessionNumberMap.set(session.id, counter);
        counter += 1;
      }
    }
  }

  const sessionsWithPlayers = filteredSessions.map((session) => {
    const players = extractPlayerSummaries(session.session_characters);
    const organizations = session.session_organizations
      .map((entry) => {
        const org = Array.isArray(entry.organization) ? entry.organization[0] : entry.organization;
        if (!org?.id || !org?.name) {
          return null;
        }
        return { id: org.id, name: org.name };
      })
      .filter((value): value is { id: string; name: string } => Boolean(value));

    return {
      ...session,
      players,
      organizations,
      sessionNumber: sessionNumberMap.get(session.id) ?? null,
    };
  });

  const mentionTargets: MentionTarget[] = [
    ...mentionCharacters.map((character) => ({
      id: character.id,
      name: character.name,
      href: `/characters/${character.id}`,
      kind: 'character' as const,
    })),
    ...organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      href: `/organizations/${organization.id}`,
      kind: 'organization' as const,
    })),
    ...campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      href: `/campaigns/${campaign.id}`,
      kind: 'campaign' as const,
    })),
  ];

  return (
    <div className="space-y-6">
      {isFilterActive && (
        <div className="rounded border border-[#ff00ff] border-opacity-30 bg-[#1a1a3e] p-4">
          <p className="text-sm text-[#ff00ff] font-mono uppercase tracking-wider">
            Showing sessions for selected campaign only
          </p>
        </div>
      )}
      
      <SessionsIndex
        sessions={sessionsWithPlayers}
        mentionTargets={mentionTargets}
        organizationMemberCounts={organizationMemberCounts}
      />
    </div>
  );
}
