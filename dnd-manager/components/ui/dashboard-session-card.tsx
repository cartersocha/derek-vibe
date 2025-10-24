"use client";

import Link from 'next/link';
import { useState } from 'react';
import { SessionParticipantPills } from '@/components/ui/session-participant-pills';
import { extractPlayerSummaries, formatDateStringForDisplay, type SessionCharacterRelation } from '@/lib/utils';

type DashboardSessionCardProps = {
  session: {
    id: string;
    name: string;
    session_date: string | null;
    created_at: string;
    campaign: { id: string; name: string } | null;
    session_characters: SessionCharacterRelation[] | null;
    session_organizations: Array<{
      organization: { id: string; name: string } | null;
    }>;
  };
  sessionNumber?: number;
  players: Array<{
    id: string;
    name: string;
    class: string | null;
    race: string | null;
    level: string | null;
    player_type: "npc" | "player" | null;
    organizations: Array<{ id: string; name: string }>;
  }>;
  organizations: Array<{ id: string; name: string }>;
};

export function DashboardSessionCard({ session, sessionNumber, players, organizations }: DashboardSessionCardProps) {
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

  const sessionDateLabel = session.session_date 
    ? formatDateStringForDisplay(session.session_date) 
    : null;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)] bg-opacity-50 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover-cyber">
      <Link
        href={`/sessions/${session.id}`}
        className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
        aria-label={`View session ${session.name}`}
      >
        <span aria-hidden="true" />
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 relative z-10 pointer-events-none">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-lg sm:text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider transition-colors hover-cyber break-words">
              {session.name}
            </span>
            {sessionNumber !== undefined && sessionNumber !== null && (
              <span className="inline-flex items-center rounded border border-[var(--cyber-magenta)] border-opacity-40 bg-[var(--cyber-magenta)]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[var(--cyber-magenta)] flex-shrink-0">
                Session #{sessionNumber}
              </span>
            )}
          </div>
          {session.campaign?.name && session.campaign.id && (
            <Link
              href={`/campaigns/${session.campaign.id}`}
              className="pointer-events-auto inline-flex text-xs font-mono uppercase tracking-widest semantic-warning transition-colors hover-brightness focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
            >
              Campaign: {session.campaign.name}
            </Link>
          )}
          {players.length > 0 && (
            <SessionParticipantPills
              sessionId={session.id}
              players={players}
              className={`pointer-events-auto ${organizations.length > 0 ? 'mt-3' : 'mt-3'}`}
              showOrganizations={false}
            />
          )}
          {organizations.length > 0 && (
            <div className={`pointer-events-auto ${players.length > 0 ? 'mt-2' : 'mt-3'}`}>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
                Groups
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {(expandedGroups.has(session.id) 
                  ? organizations 
                  : organizations.slice(0, 5)
                ).map((organization) => (
                  <Link
                    key={organization.id}
                    href={`/organizations/${organization.id}`}
                    className="inline-flex items-center rounded-full border border-[var(--semantic)]/70 bg-[var(--semantic)]/10 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--semantic)] transition hover-brightness focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic)] whitespace-nowrap"
                  >
                    {organization.name}
                  </Link>
                ))}
                {!expandedGroups.has(session.id) && organizations.length > 5 && (
                  <button
                    onClick={() => toggleSessionGroups(session.id)}
                    className="inline-flex items-center rounded-full border border-dashed border-[var(--semantic)]/50 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--semantic)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic)] whitespace-nowrap"
                  >
                    +{organizations.length - 5} more
                  </button>
                )}
                {expandedGroups.has(session.id) && organizations.length > 5 && (
                  <button
                    onClick={() => toggleSessionGroups(session.id)}
                    className="inline-flex items-center rounded-full border border-[var(--semantic)]/70 bg-[var(--semantic)]/10 px-2 py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--semantic)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic)] whitespace-nowrap"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative z-10 pointer-events-none text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] sm:ml-4 sm:text-right">
          {sessionDateLabel ? (
            <div>{sessionDateLabel}</div>
          ) : (
            <div>No date set</div>
          )}
        </div>
      </div>
    </article>
  );
}
