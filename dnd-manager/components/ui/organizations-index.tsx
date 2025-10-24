"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { renderNotesWithMentions, type MentionTarget } from "@/lib/mention-utils";
import { cn } from "@/lib/utils";
import { IndexEmptyState, IndexHeader } from "@/components/ui/index-utility";

export type OrganizationRecord = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  organization_characters?: {
    role: string;
    character: {
      id: string;
      name: string;
      player_type: string;
      status: string;
      image_url: string | null;
    };
  }[];
  organization_sessions?: {
    session: {
      id: string;
      name: string;
      session_date: string | null;
      created_at: string;
      campaign: {
        id: string;
        name: string;
      } | null;
    };
  }[];
  organization_campaigns?: {
    campaign: {
      id: string;
      name: string;
    };
  }[];
};

type OrganizationsIndexProps = {
  organizations: OrganizationRecord[];
  mentionTargets: MentionTarget[];
};

export function OrganizationsIndex({ organizations, mentionTargets }: OrganizationsIndexProps) {
  const [expandedOrganizations, setExpandedOrganizations] = useState<Set<string>>(new Set());

  const toggleOrganizationSessions = (organizationId: string) => {
    setExpandedOrganizations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(organizationId)) {
        newSet.delete(organizationId);
      } else {
        newSet.add(organizationId);
      }
      return newSet;
    });
  };

  const hasOrganizations = organizations.length > 0;

  return (
    <section className="space-y-8">
      <IndexHeader
        title="Groups"
      />

      {!hasOrganizations ? (
        <IndexEmptyState
          title="No groups yet"
          description="Create your first group to get started."
          actionHref="/organizations/new"
          actionLabel="Create Group"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((organization) => (
            <article
              key={organization.id}
              className="group relative overflow-hidden rounded-lg border border-[#00ffff] border-opacity-20 bg-[#1a1a3e] bg-opacity-50 p-6 shadow-2xl backdrop-blur-sm transition-all duration-200 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50"
            >
              <Link
                href={`/organizations/${organization.id}`}
                className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                aria-label={`View organization ${organization.name}`}
              >
                <span aria-hidden="true" />
              </Link>
              <div className="relative z-10 flex flex-col gap-3 pointer-events-none">
                <div className="flex items-center gap-4">
                  {organization.logo_url ? (
                    <div className="pointer-events-auto relative h-14 w-14 overflow-hidden rounded border border-[#00ffff]/30 bg-[#050517]">
                      <Image
                        src={organization.logo_url}
                        alt={`${organization.name} logo`}
                        fill
                        sizes="56px"
                        className="object-contain"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold uppercase tracking-wider text-[#00ffff] transition-colors group-hover:text-[#ff00ff] break-words leading-tight">
                      {organization.name}
                    </h2>
                  </div>
                </div>
                <div className="text-sm leading-relaxed text-[#cbd5f5] pointer-events-auto">
                  {organization.description ? (
                    <p className="line-clamp-4 text-[#cbd5f5]">
                      {renderNotesWithMentions(organization.description, mentionTargets)}
                    </p>
                  ) : (
                    <p className="text-[#64748b]">
                      No description yet. Edit this group to add background details.
                    </p>
                  )}
                </div>
                
                {/* Character Pills */}
                {organization.organization_characters && organization.organization_characters.length > 0 && (
                  <div className="pointer-events-auto mt-2 flex flex-wrap gap-2">
                    {organization.organization_characters.map(({ character }) => (
                      <Link
                        key={`${organization.id}-char-${character.id}`}
                        href={`/characters/${character.id}`}
                        className={cn(
                          'inline-flex items-center rounded px-2 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2',
                          character.player_type === 'player'
                            ? 'border border-[#00ffff] border-opacity-40 bg-[#0f0f23] text-[#00ffff] hover:border-[#00ffff] hover:text-[#ff00ff] focus-visible:ring-[#00ffff]'
                            : 'border border-[#ff00ff] border-opacity-40 bg-[#211027] text-[#ff6ad5] hover:border-[#ff6ad5] hover:text-[#ff9de6] focus-visible:ring-[#ff00ff]'
                        )}
                      >
                        {character.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Session Pills */}
                {organization.organization_sessions && organization.organization_sessions.length > 0 && (
                  <div className="pointer-events-auto mt-2">
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#94a3b8]">
                      Sessions
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {organization.organization_sessions
                        .sort((a, b) => {
                          // Sort by session date (most recent first)
                          // Prefer session_date over created_at
                          const aDate = new Date(a.session.session_date || a.session.created_at || 0).getTime()
                          const bDate = new Date(b.session.session_date || b.session.created_at || 0).getTime()
                          return bDate - aDate
                        })
                        .slice(0, expandedOrganizations.has(organization.id) ? organization.organization_sessions.length : 3)
                        .map((sessionRelation) => (
                        <Link
                          key={`${organization.id}-session-${sessionRelation.session.id}`}
                          href={`/sessions/${sessionRelation.session.id}`}
                          className="inline-flex items-center rounded-full border border-[#00ff88]/70 bg-[#0a1a0f] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#00ff88] transition hover:border-[#00cc6a] hover:text-[#00cc6a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] whitespace-nowrap"
                        >
                          {sessionRelation.session.name}
                        </Link>
                      ))}
                      {!expandedOrganizations.has(organization.id) && organization.organization_sessions.length > 3 && (
                        <button
                          onClick={() => toggleOrganizationSessions(organization.id)}
                          className="inline-flex items-center rounded-full border border-dashed border-[#00ff88]/50 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#00ff88] hover:border-[#00cc6a] hover:text-[#00cc6a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] whitespace-nowrap"
                        >
                          +{organization.organization_sessions.length - 3} more
                        </button>
                      )}
                      {expandedOrganizations.has(organization.id) && organization.organization_sessions.length > 3 && (
                        <button
                          onClick={() => toggleOrganizationSessions(organization.id)}
                          className="inline-flex items-center rounded-full border border-[#ff6b35]/70 bg-[#1f1100] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#ff6b35] hover:border-[#ff8a5b] hover:text-[#ff8a5b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] whitespace-nowrap"
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
