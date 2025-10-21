"use client";

import Link from 'next/link';
import { useState } from 'react';
import { renderNotesWithMentions, type MentionTarget } from '@/lib/mention-utils';
import { SessionParticipantPills } from '@/components/ui/session-participant-pills';
import { extractPlayerSummaries, formatDateStringForDisplay, type SessionCharacterRelation } from '@/lib/utils';

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
    <article className="group relative overflow-hidden rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e] bg-opacity-50 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50">
      <Link
        href={`/sessions/${session.id}`}
        className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
        aria-label={`View session ${session.name}`}
      >
        <span aria-hidden="true" />
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div className="relative z-10 flex-1 pointer-events-none">
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-lg sm:text-xl font-bold text-[#00ffff] uppercase tracking-wider transition-colors group-hover:text-[#ff00ff]">
              {session.name}
            </span>
            {sessionNumber !== undefined && sessionNumber !== null && (
              <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[#ff00ff] w-fit">
                Session #{sessionNumber}
              </span>
            )}
          </div>
          {campaignRelation?.id && campaignRelation.name && (
            <Link
              href={`/campaigns/${campaignRelation.id}`}
              className="pointer-events-auto inline-flex text-xs font-mono uppercase tracking-widest text-[#ff6b35] transition-colors hover:text-[#ff8a5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
            >
              Campaign: {campaignRelation.name}
            </Link>
          )}
          {session.notes && (
            <div className="pointer-events-auto text-gray-400 line-clamp-2 font-mono text-sm whitespace-pre-line break-words">
              {renderNotesWithMentions(session.notes, mentionTargets)}
            </div>
          )}
          {players.length > 0 && (
            <SessionParticipantPills
              sessionId={session.id}
              players={players}
              className={`pointer-events-auto ${session.organizations.length > 0 ? 'mt-3' : 'mt-3'}`}
              showOrganizations={false}
            />
          )}
          {session.organizations.length > 0 && (
            <div className={`pointer-events-auto ${players.length > 0 ? 'mt-2' : 'mt-3'}`}>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#94a3b8]">
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
                    className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcee0c]"
                  >
                    {organization.name}
                  </Link>
                ))}
                {!expandedGroups.has(session.id) && session.organizations.length > 4 && (
                  <button
                    onClick={() => toggleSessionGroups(session.id)}
                    className="inline-flex items-center rounded-full border border-dashed border-[#fcee0c]/50 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#fcee0c] hover:border-[#ffd447] hover:text-[#ffd447] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcee0c]"
                  >
                    +{session.organizations.length - 4} more
                  </button>
                )}
                {expandedGroups.has(session.id) && session.organizations.length > 4 && (
                  <button
                    onClick={() => toggleSessionGroups(session.id)}
                    className="inline-flex items-center rounded-full border border-[#ff6b35]/70 bg-[#1f1100] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#ff6b35] hover:border-[#ff8a5b] hover:text-[#ff8a5b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative z-10 pointer-events-none text-xs text-gray-500 font-mono uppercase tracking-wider sm:ml-4 sm:text-right">
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
