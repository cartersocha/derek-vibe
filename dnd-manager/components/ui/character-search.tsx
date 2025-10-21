"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { IndexEmptyState, IndexHeader, IndexSearchEmptyState } from "@/components/ui/index-utility";
import type { Character } from "@/types/database";

type CharacterWithOrganizations = Character & {
  organization_characters?: {
    role: string;
    organization: {
      id: string;
      name: string;
    };
  }[];
  session_characters?: {
    session: {
      id: string;
      name: string;
      campaign: {
        id: string;
        name: string;
      } | null;
    };
  }[];
  campaign_characters?: {
    campaign: {
      id: string;
      name: string;
    };
  }[];
};

export type CharacterSearchProps = {
  characters: CharacterWithOrganizations[];
};

export function CharacterSearch({ characters }: CharacterSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return characters;
    }

    const lowerQuery = trimmed.toLowerCase();

    return characters.filter((character) => {
      const haystack = [
        character.name,
        character.race,
        character.class,
        character.level,
        character.last_known_location,
        character.player_type,
        character.status,
        // Add related organizations to search
        character.organization_characters?.map((org) => org.organization.name).join(" ") ?? "",
        // Add related sessions to search
        character.session_characters?.map((session) => session.session.name).join(" ") ?? "",
        // Add related campaigns to search (from sessions)
        character.session_characters?.map((session) => session.session.campaign?.name).filter(Boolean).join(" ") ?? "",
        // Add direct campaign relationships
        character.campaign_characters?.map((campaign) => campaign.campaign.name).join(" ") ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(lowerQuery);
    });
  }, [characters, query]);

  const hasCharacters = characters.length > 0;

  return (
    <div className="space-y-6">
      <IndexHeader
        title="Characters"
        searchId="character-search"
        searchPlaceholder="Search"
        searchValue={query}
        onSearchChange={(event) => setQuery(event.target.value)}
        searchDisabled={!hasCharacters}
        actionHref="/characters/new"
        actionLabel="+ New Character"
      />

      {!hasCharacters ? (
        <IndexEmptyState
          title="No characters yet"
          description="Create your first character to get started."
          actionHref="/characters/new"
          actionLabel="Create Character"
        />
      ) : filtered.length === 0 ? (
        <IndexSearchEmptyState message="No characters matched your search." />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((character) => {
            const isPlayerCharacter = character.player_type === "player";
            const headingClasses = isPlayerCharacter
              ? "text-[#00ffff] group-hover:text-[#ff00ff]"
              : "text-[#ff6ad5] group-hover:text-[#ff9de6]";
            const detailLabelClass = cn(
              "mr-1 align-middle text-[10px] font-semibold uppercase tracking-widest",
              isPlayerCharacter ? "text-[#00ffff]" : "text-[#ff6ad5]"
            );

            const statusLabel =
              character.status === "dead"
                ? "Dead"
                : character.status === "unknown"
                  ? "Unknown"
                  : "Alive";

            const details: Array<{ label: string; value: string }> = [
              {
                label: "Type",
                value: character.player_type === "player" ? "Player" : "NPC",
              },
              {
                label: "Status",
                value: statusLabel,
              },
            ];

            if (character.race) {
              details.push({ label: "Race", value: character.race });
            }

            if (character.class) {
              details.push({ label: "Class", value: character.class });
            }

            if (character.level !== null && character.level !== undefined && character.level !== "") {
              const levelValue = typeof character.level === "number" || typeof character.level === "string"
                ? character.level
                : null;
              const levelString = levelValue !== null ? String(levelValue) : null;

              if (levelString) {
              details.push(
                character.player_type === "player"
                  ? { label: "Level", value: levelString }
                  : { label: "Challenge", value: `CR ${levelString}` }
              );
              }
            }

            if (character.last_known_location) {
              details.push({ label: "Last Seen", value: character.last_known_location });
            }

            const borderStyle = isPlayerCharacter
              ? "border-[#00ffff] hover:border-[#00ffff] hover:shadow-[#00ffff]/50 focus-visible:ring-[#00ffff]"
              : "border-[#ff00ff] hover:border-[#ff6ad5] hover:shadow-[#ff6ad5]/50 focus-visible:ring-[#ff6ad5]";

            return (
              <article
                key={character.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg border border-opacity-30 bg-[#1a1a3e]/70 p-5 shadow-2xl backdrop-blur-sm transition-all duration-200 focus:outline-none focus-visible:ring-2",
                  borderStyle
                )}
              >
                <Link
                  href={`/characters/${character.id}`}
                  className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050517]"
                  aria-label={`View character ${character.name}`}
                >
                  <span aria-hidden="true" />
                </Link>
                <div className="relative z-10 flex h-full flex-col gap-3 pointer-events-none">
                  <div>
                    <h3
                      className={cn(
                        "mb-2 text-lg font-bold uppercase tracking-wider transition-colors",
                        headingClasses
                      )}
                    >
                      {character.name}
                    </h3>
                    <div className="space-y-1 text-xs text-[#cbd5f5] sm:text-sm">
                      {details.map((detail) => (
                        <p key={`${character.id}-${detail.label}`} className="font-mono text-[#94a3b8]">
                          <span className={detailLabelClass}>{detail.label}:</span>
                          <span className="align-middle text-[#cbd5f5]">{detail.value}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {character.organization_characters && character.organization_characters.length > 0 ? (
                    <div className="pointer-events-auto mt-auto flex flex-wrap gap-2">
                      {character.organization_characters.map(({ organization }) => (
                        <Link
                          key={`${character.id}-org-${organization.id}`}
                          href={`/organizations/${organization.id}`}
                          className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd447]"
                        >
                          {organization.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
