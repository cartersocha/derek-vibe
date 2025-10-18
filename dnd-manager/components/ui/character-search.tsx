"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  character.status,
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
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Characters</h1>
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
          {filtered.map((character) => (
            <Link
              key={character.id}
              href={`/characters/${character.id}`}
              className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-5 hover:border-[#ff00ff] hover:shadow-[#ff00ff]/50 transition-all duration-200 group"
            >
              <h3 className="text-lg font-bold text-[#00ffff] mb-2 uppercase tracking-wider group-hover:text-[#ff00ff] transition-colors">
                {character.name}
              </h3>
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="text-gray-400 font-mono">
                  {character.player_type === "player" ? "Player Character" : "NPC"}
                </p>
                <p className="text-gray-400 font-mono">
                  Status: {character.status === "dead" ? "Dead" : character.status === "unknown" ? "Unknown" : "Alive"}
                </p>
                {(() => {
                  const lineage = [character.race, character.class].filter(Boolean).join(" ");
                  return lineage ? (
                    <p className="text-gray-400 font-mono">{lineage}</p>
                  ) : null;
                })()}
                {character.level && (
                  <p className="text-gray-400 font-mono">
                    {character.player_type === "player" ? `Level ${character.level}` : `CR ${character.level}`}
                  </p>
                )}
                <p className="text-gray-400 font-mono">
                  Status: {character.status.charAt(0).toUpperCase() + character.status.slice(1)}
                </p>
                {character.last_known_location && (
                  <p className="text-gray-500 font-mono text-[11px] uppercase tracking-wider">
                    Last seen: {character.last_known_location}
                  </p>
                )}
                {character.backstory && (
                  <p className="text-gray-500 line-clamp-3 mt-2 font-mono text-xs">
                    {character.backstory}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
