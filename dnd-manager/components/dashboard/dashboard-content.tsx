"use client";

import { useCampaignFilter } from "@/components/providers/campaign-filter-provider";
import { DashboardSessionCard } from "@/components/ui/dashboard-session-card";
import { extractPlayerSummaries, type SessionCharacterRelation } from "@/lib/utils";

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

interface DashboardContentProps {
  recentSessions: Session[];
  campaignsCount: number;
  sessionsCount: number;
  charactersCount: number;
}

export default function DashboardContent({ 
  recentSessions, 
  campaignsCount, 
  sessionsCount, 
  charactersCount 
}: DashboardContentProps) {
  const { selectedCampaignId, isFilterActive } = useCampaignFilter();

  // Filter sessions based on selected campaign
  const filteredSessions = selectedCampaignId 
    ? recentSessions.filter(session => session.campaign_id === selectedCampaignId)
    : recentSessions;

  const sessionsWithPlayers = filteredSessions.map((session) => {
    const players = extractPlayerSummaries(session.session_characters);
    const organizations = session.session_organizations
      .map((entry) => {
        const org = Array.isArray(entry?.organization) ? entry?.organization?.[0] : entry?.organization;
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
    };
  });

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded border border-[#00ffff] border-opacity-20 bg-[#0f0f23] p-4 shadow-lg shadow-[#00ffff]/10">
          <div className="text-2xl font-bold text-[#00ffff]">{campaignsCount}</div>
          <div className="text-sm text-gray-400 uppercase tracking-wider">Campaigns</div>
        </div>
        <div className="rounded border border-[#00ffff] border-opacity-20 bg-[#0f0f23] p-4 shadow-lg shadow-[#00ffff]/10">
          <div className="text-2xl font-bold text-[#00ffff]">{sessionsCount}</div>
          <div className="text-sm text-gray-400 uppercase tracking-wider">Sessions</div>
        </div>
        <div className="rounded border border-[#00ffff] border-opacity-20 bg-[#0f0f23] p-4 shadow-lg shadow-[#00ffff]/10">
          <div className="text-2xl font-bold text-[#00ffff]">{charactersCount}</div>
          <div className="text-sm text-gray-400 uppercase tracking-wider">Characters</div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">
            Recent Sessions
            {isFilterActive && (
              <span className="ml-2 text-sm text-[#ff00ff]">
                (Filtered)
              </span>
            )}
          </h2>
        </div>
        
        {filteredSessions.length === 0 ? (
          <div className="rounded border border-[#00ffff] border-opacity-20 bg-[#0f0f23] p-8 text-center">
            <p className="text-gray-400">
              {isFilterActive 
                ? "No sessions found for the selected campaign." 
                : "No sessions found."
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessionsWithPlayers.map((session) => (
              <DashboardSessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
