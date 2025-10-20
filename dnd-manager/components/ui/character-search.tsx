"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Character } from "@/types/database";

export type CharacterSearchProps = {
  characters: Character[];
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="retro-title text-3xl font-bold text-[#00ffff]">Characters</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <label className="sr-only" htmlFor="character-search">
            Search characters
          </label>
          <input
            id="character-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            type="search"
            disabled={!hasCharacters}
            className="h-9 w-full rounded border border-[#00ffff] border-opacity-40 bg-[#0f0f23] px-3 font-mono text-xs uppercase tracking-wider text-[#00ffff] placeholder:text-[#00ffff]/60 focus:border-[#ff00ff] focus:outline-none focus:ring-1 focus:ring-[#ff00ff] disabled:border-opacity-20 disabled:text-[#00ffff]/40 sm:w-52"
          />
          <Link
            href="/characters/new"
            className="w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-xs sm:text-sm sm:px-5 sm:py-2.5 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            + New Character
          </Link>
        </div>
      </div>

      {!hasCharacters ? (
        <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-12 text-center">
          <h3 className="text-lg font-medium text-[#00ffff] mb-2 uppercase tracking-wider">No characters yet</h3>
          <p className="text-gray-400 mb-6 font-mono">Create your first character to get started</p>
          <Link
            href="/characters/new"
            className="inline-block w-full sm:w-auto bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50 text-center"
          >
            Create Character
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded border border-dashed border-[#00ffff]/40 bg-[#0f0f23]/60 p-8 text-center">
          <p className="font-mono text-sm text-[#00ffff]/70">No characters matched your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-5">
          {filtered.map((character) => {
            const isPlayerCharacter = character.player_type === "player";
            const cardClasses = isPlayerCharacter
              ? "border-[#00ffff] border-opacity-35 bg-[#0f1428] hover:border-[#00ffff] hover:shadow-[#00ffff]/40 focus-visible:ring-[#00ffff]"
              : "border-[#ff00ff] border-opacity-35 bg-[#1a0220] hover:border-[#ff6ad5] hover:shadow-[#ff6ad5]/40 focus-visible:ring-[#ff6ad5]";
            const headingClasses = isPlayerCharacter
              ? "text-[#00ffff] group-hover:text-[#ff00ff]"
              : "text-[#ff6ad5] group-hover:text-[#ff9de6]";
            const detailLabelClass = cn(
              "mr-1 uppercase tracking-widest text-[10px] align-middle",
              isPlayerCharacter ? "text-[#00ffff]" : "text-[#ff6ad5]"
            );

            return (
              <Link
                key={character.id}
                href={`/characters/${character.id}`}
                className={cn(
                  "backdrop-blur-sm rounded-lg border shadow-2xl p-5 transition-all duration-200 group focus:outline-none focus-visible:ring-2",
                  cardClasses
                )}
              >
                <h3
                  className={cn(
                    "text-lg font-bold mb-2 uppercase tracking-wider transition-colors",
                    headingClasses
                  )}
                >
                  {character.name}
                </h3>
                {(() => {
                const statusLabel = character.status === "dead"
                  ? "Dead"
                  : character.status === "unknown"
                    ? "Unknown"
                    : "Alive";

                const levelLabel = character.level
                  ? character.player_type === "player"
                    ? `Level ${character.level}`
                    : `CR ${character.level}`
                  : null;

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

                if (levelLabel) {
                  details.push({ label: character.player_type === "player" ? "Level" : "Challenge", value: levelLabel });
                }

                if (character.last_known_location) {
                  details.push({ label: "Last Seen", value: character.last_known_location });
                }

                return (
                  <div className="space-y-1 text-xs sm:text-sm">
                    {details.map((detail) => (
                      <p key={`${character.id}-${detail.label}`} className="text-gray-400 font-mono">
                        <span className={detailLabelClass}>{detail.label}:</span>
                        <span className="align-middle">{detail.value}</span>
                      </p>
                    ))}
                  </div>
                );
              })()}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
