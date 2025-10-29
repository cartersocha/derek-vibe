"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDateStringForDisplay, type PlayerSummary, getPillClasses, getDashedPillClasses, cn } from "@/lib/utils";
import { SessionParticipantPills } from "@/components/ui/session-participant-pills";
import { IndexEmptyState, IndexHeader } from "@/components/ui/index-utility";

type CampaignInfo = {
  id: string | null;
  name: string | null;
};

type SessionGroup = {
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
  groups: SessionGroup[];
};

type SessionsIndexProps = {
  sessions: SessionRecord[];
};

export function SessionsIndex({ sessions }: SessionsIndexProps) {
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
            const groups = session.groups;
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
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-2">
                      <div className="mb-2 sm:mb-0">
                        <span className="text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider transition-colors hover-cyber">
                          {session.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
                        {session.campaign && session.campaign.id && session.campaign.name && (
                          <Link
                              href={`/campaigns/${session.campaign.id}`}
                            prefetch
                              className={getPillClasses('campaign', 'small')}
                          >
                            {session.campaign.name}
                          </Link>
                        )}
                        {session.sessionNumber !== null && session.sessionNumber !== undefined && (
                          <span className={getPillClasses('session', 'small')}>
                            Session #{session.sessionNumber}
                          </span>
                        )}
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
                    {players.length > 0 && (
                      <div className={`pointer-events-auto ${groups.length > 0 ? "mt-3" : "mt-4"}`}>
                        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
                          Participants
                        </div>
                        <SessionParticipantPills
                          sessionId={session.id}
                          players={players}
                          className=""
                          showGroups={false}
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
                          ).map((group) => (
                            <Link
                              key={group.id}
                              href={`/groups/${group.id}`}
                              prefetch
                              className={getPillClasses('group', 'small')}
                            >
                              {group.name}
                            </Link>
                          ))}
                          {!expandedGroups.has(session.id) && groups.length > 6 && (
                            <button
                              onClick={() => toggleSessionGroups(session.id)}
                              className={getDashedPillClasses('group', 'small')}
                              aria-label={`Show ${groups.length - 6} more groups`}
                            >
                              +{groups.length - 6} more
                            </button>
                          )}
                          {expandedGroups.has(session.id) && groups.length > 6 && (
                          <button
                            onClick={() => toggleSessionGroups(session.id)}
                              className={getPillClasses('default', 'small')}
                            aria-label="Show fewer groups"
                          >
                              Show less
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 pointer-events-none sm:text-right sm:ml-4" />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}