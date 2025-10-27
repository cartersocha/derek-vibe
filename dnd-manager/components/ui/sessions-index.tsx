"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDateStringForDisplay, type PlayerSummary, getPillClasses, getDashedPillClasses, cn } from "@/lib/utils";
import { renderNotesWithMentions, type MentionTarget } from "@/lib/mention-utils";
import { SessionParticipantPills } from "@/components/ui/session-participant-pills";
import { IndexEmptyState, IndexHeader } from "@/components/ui/index-utility";

type CampaignInfo = {
  id: string | null;
  name: string | null;
};

type SessionOrganization = {
  id: string
  name: string
}

type SessionRecord = {
  id: string;
  name: string;
  notes: string | null;
  session_date: string | null;
  created_at: string | null;
  campaign_id: string | null;
  campaign: CampaignInfo | null;
  sessionNumber: number | null;
  players: PlayerSummary[];
  organizations: SessionOrganization[];
};

type SessionsIndexProps = {
  sessions: SessionRecord[];
  mentionTargets: MentionTarget[];
};

export function SessionsIndex({ sessions, mentionTargets }: SessionsIndexProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleSessionGroups = (sessionId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const hasSessions = sessions.length > 0;

  return (
    <div className="space-y-6">
      <IndexHeader
        title="Sessions"
      />

      {!hasSessions ? (
        <IndexEmptyState
          title="No sessions yet"
          description="Create your first session to get started."
          actionHref="/sessions/new"
          actionLabel="Create Session"
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const players = session.players;
            const groups = session.organizations;
            const sessionDateLabel = formatDateStringForDisplay(session.session_date);

            return (
              <article
                key={session.id}
                className="group relative overflow-hidden rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)] bg-opacity-50 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover-cyber"
              >
                <Link
                  href={`/sessions/${session.id}`}
                  prefetch
                  className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
                  aria-label={`View session ${session.name}`}
                >
                  <span aria-hidden="true" />
                </Link>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                  <div className="relative z-10 flex-1 pointer-events-none">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider transition-colors hover-cyber">
                        {session.name}
                      </span>
                      {session.sessionNumber !== null && session.sessionNumber !== undefined && (
                          <span className={getPillClasses('session', 'small')}>
                          Session #{session.sessionNumber}
                        </span>
                      )}
                    </div>
                    {session.campaign && session.campaign.id && session.campaign.name && (
                    <Link
                        href={`/campaigns/${session.campaign.id}`}
                      prefetch
                        className="pointer-events-auto inline-flex text-xs font-mono uppercase tracking-widest text-[var(--orange-400)] hover:text-[var(--orange-500)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
                      >
                        Campaign: {session.campaign.name}
                      </Link>
                    )}
                    {players.length > 0 && (
                      <div className={`pointer-events-auto ${groups.length > 0 ? "mt-3" : "mt-4"}`}>
                        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
                          Participants
                        </div>
                        <SessionParticipantPills
                          sessionId={session.id}
                          players={players}
                          className=""
                          showOrganizations={false}
                        />
                      </div>
                    )}
                    {groups.length > 0 && (
                      <div className={`pointer-events-auto ${players.length > 0 ? "mt-2" : "mt-3"}`}>
                        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
                          Groups
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(expandedGroups.has(session.id) 
                            ? groups 
                            : groups.slice(0, 6)
                          ).map((organization) => (
                            <Link
                              key={organization.id}
                              href={`/organizations/${organization.id}`}
                              prefetch
                              className={getPillClasses('organization', 'small')}
                            >
                              {organization.name}
                            </Link>
                          ))}
                          {!expandedGroups.has(session.id) && groups.length > 6 && (
                            <button
                              onClick={() => toggleSessionGroups(session.id)}
                              className={getDashedPillClasses('organization', 'small')}
                              aria-label={`Show ${groups.length - 6} more organizations`}
                            >
                              +{groups.length - 6} more
                            </button>
                          )}
                          {expandedGroups.has(session.id) && groups.length > 6 && (
                          <button
                            onClick={() => toggleSessionGroups(session.id)}
                              className={getPillClasses('default', 'small')}
                            aria-label="Show fewer organizations"
                          >
                              Show less
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 pointer-events-none sm:text-right sm:ml-4">
                    {sessionDateLabel ? (
                      <span className={getPillClasses('date', 'small')}>
                        {sessionDateLabel}
                      </span>
                    ) : (
                      <span className={cn(getPillClasses('date', 'small'), 'text-[var(--text-muted)] border-[var(--text-muted)]/40')}>
                        No date set
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}