"use client";

import Link from 'next/link';
import { useState } from 'react';
import { renderNotesWithMentions, type MentionTarget } from '@/lib/mention-utils';
import { SessionParticipantPills } from '@/components/ui/session-participant-pills';
import { extractPlayerSummaries, formatDateStringForDisplay, type SessionCharacterRelation, getPillClasses, getDashedPillClasses, cn } from '@/lib/utils';

type CampaignSessionCardProps = {
  session: {
    id: string;
    name: string;
    notes: string | null;
    session_date: string | null;
    created_at: string | null;
    session_characters: SessionCharacterRelation[] | null;
    organizations: Array<{ id: string; name: string }>;
  };
  mentionTargets: MentionTarget[];
  sessionNumber?: number | null;
  campaignRelation?: { id: string; name: string } | null;
};

export function CampaignSessionCard({ 
  session, 
  mentionTargets, 
  sessionNumber, 
  campaignRelation 
}: CampaignSessionCardProps) {
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

  const players = extractPlayerSummaries(session.session_characters);
  const sessionDateLabel = session.session_date 
    ? formatDateStringForDisplay(session.session_date) 
    : null;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 bg-[var(--bg-card)] bg-opacity-50 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover-cyber">
      <Link
        href={`/sessions/${session.id}`}
        className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
        aria-label={`View session ${session.name}`}
      >
        <span aria-hidden="true" />
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div className="relative z-10 flex-1 pointer-events-none">
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-lg sm:text-xl font-bold text-[var(--cyber-cyan)] uppercase tracking-wider transition-colors hover-cyber">
              {session.name}
            </span>
            {sessionNumber !== undefined && sessionNumber !== null && (
              <span className={cn(getPillClasses('session', 'small'), 'w-fit')}>
                Session #{sessionNumber}
              </span>
            )}
          </div>
          {campaignRelation?.id && campaignRelation.name && (
            <Link
              href={`/campaigns/${campaignRelation.id}`}
              className="pointer-events-auto inline-flex text-xs font-mono uppercase tracking-widest text-[var(--orange-400)] hover:text-[var(--orange-500)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
            >
              Campaign: {campaignRelation.name}
            </Link>
          )}
          {players.length > 0 && (
            <div className={`pointer-events-auto ${session.organizations.length > 0 ? 'mt-3' : 'mt-3'}`}>
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
          {session.organizations.length > 0 && (
            <div className={`pointer-events-auto ${players.length > 0 ? 'mt-2' : 'mt-3'}`}>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
                Groups
              </div>
              <div className="flex flex-wrap gap-2">
                {(expandedGroups.has(session.id) 
                  ? session.organizations 
                  : session.organizations.slice(0, 4)
                ).map((organization) => (
                  <Link
                    key={organization.id}
                    href={`/organizations/${organization.id}`}
                    className={cn(getPillClasses('organization', 'small'), 'whitespace-nowrap')}
                  >
                    {organization.name}
                  </Link>
                ))}
                {!expandedGroups.has(session.id) && session.organizations.length > 4 && (
                  <button
                    onClick={() => toggleSessionGroups(session.id)}
                    className={cn(getDashedPillClasses('organization', 'small'), 'whitespace-nowrap')}
                  >
                    +{session.organizations.length - 4} more
                  </button>
                )}
                {expandedGroups.has(session.id) && session.organizations.length > 4 && (
                  <button
                    onClick={() => toggleSessionGroups(session.id)}
                    className={cn(getPillClasses('organization', 'small'), 'whitespace-nowrap')}
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative z-10 pointer-events-none sm:ml-4 sm:text-right">
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
}
