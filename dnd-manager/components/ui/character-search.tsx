"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizeSearchQuery } from "@/lib/security/sanitize";
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
      session_date: string | null;
      created_at: string | null;
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
    const sanitizedQuery = sanitizeSearchQuery(query);
    const trimmed = sanitizedQuery.trim();
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
              ? "text-[var(--cyber-cyan)] hover-cyber"
              : "text-[var(--cyber-magenta)] hover-cyber";
            const detailLabelClass = cn(
              "mr-1 align-middle text-[10px] font-semibold uppercase tracking-widest",
              isPlayerCharacter ? "text-[var(--cyber-cyan)]" : "text-[var(--cyber-magenta)]"
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
              ? "border-[var(--cyber-cyan)] hover-cyber focus-visible:ring-[var(--cyber-cyan)]"
              : "border-[var(--cyber-magenta)] hover-cyber focus-visible:ring-[var(--cyber-magenta)]";

            return (
              <article
                key={character.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg border border-opacity-30 bg-[var(--bg-card)]/70 p-5 shadow-2xl backdrop-blur-sm transition-all duration-200 focus:outline-none focus-visible:ring-2",
                  borderStyle
                )}
              >
                <Link
                  href={`/characters/${character.id}`}
                  className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
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
                    <div className="space-y-1 text-xs text-[var(--text-primary)] sm:text-sm">
                      {details.map((detail) => (
                        <p key={`${character.id}-${detail.label}`} className="font-mono text-[var(--text-secondary)]">
                          <span className={detailLabelClass}>{detail.label}:</span>
                          <span className="align-middle text-[var(--text-primary)]">{detail.value}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {character.organization_characters && character.organization_characters.length > 0 ? (
                    <div className="pointer-events-auto mt-2">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
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
                            className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] transition hover-brightness focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] whitespace-nowrap"
                          >
                            {organization.name}
                          </Link>
                        ))}
                        {!expandedGroups.has(character.id) && character.organization_characters.length > 4 && (
                          <button
                            onClick={() => toggleCharacterGroups(character.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-[var(--cyber-magenta)]/50 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)] whitespace-nowrap"
                          >
                            +{character.organization_characters.length - 4} more
                          </button>
                        )}
                        {expandedGroups.has(character.id) && character.organization_characters.length > 4 && (
                          <button
                            onClick={() => toggleCharacterGroups(character.id)}
                            className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.25em] text-[var(--cyber-magenta)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {character.session_characters && character.session_characters.length > 0 && (
                    <div className="pointer-events-auto mt-2">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--text-secondary)]">
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
                            className="inline-flex items-center rounded-full border border-[var(--cyber-cyan)]/70 bg-[var(--cyber-cyan)]/10 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cyber-cyan)] transition hover-cyber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-cyan)] whitespace-nowrap"
                          >
                            {sessionRelation.session.name}
                          </Link>
                        ))}
                        {!expandedCharacters.has(character.id) && character.session_characters.length > 3 && (
                          <button
                            onClick={() => toggleCharacterSessions(character.id)}
                            className="inline-flex items-center rounded-full border border-dashed border-[var(--cyber-cyan)]/50 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cyber-cyan)] hover-cyber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-cyan)] whitespace-nowrap"
                          >
                            +{character.session_characters.length - 3} more
                          </button>
                        )}
                        {expandedCharacters.has(character.id) && character.session_characters.length > 3 && (
                          <button
                            onClick={() => toggleCharacterSessions(character.id)}
                            className="inline-flex items-center rounded-full border border-[var(--cyber-magenta)]/70 bg-[var(--cyber-magenta)]/10 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--cyber-magenta)] hover-brightness transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]"
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
