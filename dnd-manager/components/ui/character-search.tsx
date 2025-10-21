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
  const [expandedCharacters, setExpandedCharacters] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleCharacterSessions = (characterId: string) => {
    setExpandedCharacters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

  const toggleCharacterGroups = (characterId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                <div className="relative z-10 flex flex-col gap-3 pointer-events-none">
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
                    <div className="pointer-events-auto mt-2">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#94a3b8]">
                        Groups
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(expandedGroups.has(character.id) 
                          ? character.organization_characters 
                          : character.organization_characters.slice(0, 4)
                        ).map(({ organization }) => (
                          <Link
                            key={`${character.id}-org-${organization.id}`}
                            href={`/organizations/${organization.id}`}
                            className="inline-flex items-center rounded-full border border-[#fcee0c]/70 bg-[#1a1400] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[#fcee0c] transition hover:border-[#ffd447] hover:text-[#ffd447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd447]"
                          >
                            {organization.name}
                          </Link>
                        ))}
                        {!expandedGroups.has(character.id) && character.organization_characters.length > 4 && (
                          <button
                            onClick={() => toggleCharacterGroups(character.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-[#fcee0c]/50 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[#fcee0c] hover:border-[#ffd447] hover:text-[#ffd447] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcee0c]"
                          >
                            +{character.organization_characters.length - 4} more
                          </button>
                        )}
                        {expandedGroups.has(character.id) && character.organization_characters.length > 4 && (
                          <button
                            onClick={() => toggleCharacterGroups(character.id)}
                            className="inline-flex items-center rounded-full border border-[#ff6b35]/70 bg-[#1f1100] px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[#ff6b35] hover:border-[#ff8a5b] hover:text-[#ff8a5b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {character.session_characters && character.session_characters.length > 0 && (
                    <div className="pointer-events-auto mt-2">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#94a3b8]">
                        Sessions
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(expandedCharacters.has(character.id) 
                          ? character.session_characters 
                          : character.session_characters.slice(0, 3)
                        ).sort((a, b) => {
                          // Sort by session date (most recent first)
                          // Prefer session_date over created_at
                          const aDate = new Date(a.session.session_date || a.session.created_at || 0).getTime()
                          const bDate = new Date(b.session.session_date || b.session.created_at || 0).getTime()
                          return bDate - aDate
                        }).map((sessionRelation) => (
                          <Link
                            key={`${character.id}-session-${sessionRelation.session.id}`}
                            href={`/sessions/${sessionRelation.session.id}`}
                            className="inline-flex items-center rounded-full border border-[#00ff88]/70 bg-[#0a1a0f] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#00ff88] transition hover:border-[#00cc6a] hover:text-[#00cc6a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                          >
                            {sessionRelation.session.name}
                          </Link>
                        ))}
                        {!expandedCharacters.has(character.id) && character.session_characters.length > 3 && (
                          <button
                            onClick={() => toggleCharacterSessions(character.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-[#00ff88]/50 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#00ff88] hover:border-[#00cc6a] hover:text-[#00cc6a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                          >
                            +{character.session_characters.length - 3} more
                          </button>
                        )}
                        {expandedCharacters.has(character.id) && character.session_characters.length > 3 && (
                          <button
                            onClick={() => toggleCharacterSessions(character.id)}
                            className="inline-flex items-center rounded-full border border-[#ff6b35]/70 bg-[#1f1100] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[#ff6b35] hover:border-[#ff8a5b] hover:text-[#ff8a5b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
