"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDateStringForDisplay, type PlayerSummary } from "@/lib/utils";
import { renderNotesWithMentions, type MentionTarget } from "@/lib/mention-utils";
import { SessionParticipantPills } from "@/components/ui/session-participant-pills";

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
  const [query, setQuery] = useState("");

  const hasSessions = sessions.length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSessions = useMemo(() => {
    if (!normalizedQuery) {
      return sessions;
    }

    return sessions.filter((session) => {
      const haystack = [
        session.name,
        session.campaign?.name ?? "",
        session.notes ?? "",
        session.players.map((player) => player.name).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, sessions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="retro-title text-3xl font-bold text-[#00ffff]">Sessions</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <label className="sr-only" htmlFor="session-search">
            Search sessions
          </label>
          <input
            id="session-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            type="search"
            disabled={!hasSessions}
            className="h-9 w-full rounded border border-[#00ffff] border-opacity-40 bg-[#0f0f23] px-3 font-mono text-xs uppercase tracking-wider text-[#00ffff] placeholder:text-[#00ffff]/60 focus:border-[#ff00ff] focus:outline-none focus:ring-1 focus:ring-[#ff00ff] disabled:border-opacity-20 disabled:text-[#00ffff]/40 sm:w-52"
          />
          <Link
            href="/sessions/new"
            className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-xs sm:text-sm sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            + New Session
          </Link>
        </div>
      </div>

      {!hasSessions ? (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-12 text-center">
          <h3 className="text-lg font-medium text-[#00ffff] mb-2 uppercase tracking-wider">
            No sessions yet
          </h3>
          <p className="text-gray-400 mb-6 font-mono">
            Create your first session to get started
          </p>
          <Link
            href="/sessions/new"
            className="inline-block w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            Create Session
          </Link>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded border border-dashed border-[#00ffff]/40 bg-[#0f0f23]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#00ffff]/70">
            No sessions matched your search.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const players = session.players;
            const groups = session.organizations;
            const sessionDateLabel = formatDateStringForDisplay(session.session_date);

            return (
              <article
                key={session.id}
                className="group relative overflow-hidden rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e] bg-opacity-50 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50"
              >
                <Link
                  href={`/sessions/${session.id}`}
                  className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                  aria-label={`View session ${session.name}`}
                >
                  <span aria-hidden="true" />
                </Link>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                  <div className="relative z-10 flex-1 pointer-events-none">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xl font-bold text-[#00ffff] uppercase tracking-wider transition-colors group-hover:text-[#ff00ff]">
                        {session.name}
                      </span>
                      {session.sessionNumber !== null && session.sessionNumber !== undefined && (
                        <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[#ff00ff]">
                          Session #{session.sessionNumber}
                        </span>
                      )}
                    </div>
                    {session.campaign && session.campaign.id && session.campaign.name && (
                      <Link
                        href={`/campaigns/${session.campaign.id}`}
                        className="pointer-events-auto inline-flex text-xs font-mono uppercase tracking-widest text-[#ff6b35] transition-colors hover:text-[#ff8a5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                      >
                        Campaign: {session.campaign.name}
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
                        className={`pointer-events-auto ${groups.length > 0 ? 'mt-3' : 'mt-3'}`}
                        showOrganizations={false}
                      />
                    )}
                    {groups.length > 0 && (
                      <div className={`flex flex-wrap gap-2 pointer-events-auto ${players.length > 0 ? 'mt-2' : 'mt-3'}`}>
                        {groups.map((organization) => (
                          <Link
                            key={organization.id}
                            href={`/organizations/${organization.id}`}
                            className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447]"
                          >
                            {organization.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 pointer-events-none text-xs text-gray-500 font-mono uppercase tracking-wider sm:text-right sm:ml-4">
                    {sessionDateLabel ? (
                      <div>{sessionDateLabel}</div>
                    ) : (
                      <div>No date set</div>
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
