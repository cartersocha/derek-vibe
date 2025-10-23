import Link from 'next/link';
import { SessionParticipantPills } from '@/components/ui/session-participant-pills';
import { formatDateStringForDisplay } from '@/lib/utils';
import { ExpandableOrganizations } from './expandable-organizations';

type DashboardSessionCardProps = {
  session: {
    id: string;
    name: string;
    session_date: string | null;
    created_at: string;
    campaign: { id: string; name: string } | null;
    session_characters: any[] | null;
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

  const sessionDateLabel = session.session_date 
    ? formatDateStringForDisplay(session.session_date) 
    : null;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e] bg-opacity-50 p-4 sm:p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50">
      <Link
        href={`/sessions/${session.id}`}
        className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
        aria-label={`View session ${session.name}`}
      >
        <span aria-hidden="true" />
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 relative z-10 pointer-events-none">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-lg sm:text-xl font-bold text-[#00ffff] uppercase tracking-wider transition-colors group-hover:text-[#ff00ff] break-words">
              {session.name}
            </span>
            {sessionNumber !== undefined && sessionNumber !== null && (
              <span className="inline-flex items-center rounded border border-[#ff00ff] border-opacity-40 bg-[#ff00ff]/10 px-2 py-0.5 text-xs font-mono uppercase tracking-widest text-[#ff00ff] flex-shrink-0">
                Session #{sessionNumber}
              </span>
            )}
          </div>
          {session.campaign?.name && session.campaign.id && (
            <Link
              href={`/campaigns/${session.campaign.id}`}
              className="pointer-events-auto inline-flex text-xs font-mono uppercase tracking-widest text-[#ff6b35] transition-colors hover:text-[#ff8a5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
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
            <ExpandableOrganizations
              sessionId={session.id}
              organizations={organizations}
              className={`pointer-events-auto ${players.length > 0 ? 'mt-2' : 'mt-3'}`}
            />
          )}
        </div>
        <div className="relative z-10 pointer-events-none text-xs font-mono uppercase tracking-wider text-gray-500 sm:ml-4 sm:text-right">
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
