"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { renderNotesWithMentions, type MentionTarget } from "@/lib/mention-utils";
import { cn } from "@/lib/utils";
import { IndexEmptyState, IndexHeader, IndexSearchEmptyState } from "@/components/ui/index-utility";

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
};

type OrganizationsIndexProps = {
  organizations: OrganizationRecord[];
  mentionTargets: MentionTarget[];
};

export function OrganizationsIndex({ organizations, mentionTargets }: OrganizationsIndexProps) {
  const [query, setQuery] = useState("");
  const hasOrganizations = organizations.length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredOrganizations = useMemo(() => {
    if (!normalizedQuery) {
      return organizations;
    }

    return organizations.filter((organization) => {
      const haystack = [
        organization.name,
        organization.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, organizations]);

  return (
    <section className="space-y-8">
      <IndexHeader
        title="Groups"
        searchId="organization-search"
        searchPlaceholder="Search"
        searchValue={query}
        onSearchChange={(event) => setQuery(event.target.value)}
        searchDisabled={!hasOrganizations}
        actionHref="/organizations/new"
        actionLabel="+ New Group"
      />

      {!hasOrganizations ? (
        <IndexEmptyState
          title="No groups yet"
          description="Create your first group to get started."
          actionHref="/organizations/new"
          actionLabel="Create Group"
        />
      ) : filteredOrganizations.length === 0 ? (
        <IndexSearchEmptyState message="No groups matched your search." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrganizations.map((organization) => (
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
              <div className="relative z-10 flex h-full flex-col gap-4 pointer-events-none">
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
                <div className="flex-1 text-sm leading-relaxed text-[#cbd5f5] pointer-events-auto">
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
                  <div className="pointer-events-auto mt-3 flex flex-wrap gap-2">
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
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
