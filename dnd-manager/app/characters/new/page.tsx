'use client'

import { Suspense, useCallback, useState } from "react";
import { createCharacter } from "@/lib/actions/characters";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ImageUpload from "@/components/ui/image-upload";
import AutoResizeTextarea from "@/components/ui/auto-resize-textarea";
import CreatableSelect from "@/components/ui/creatable-select";
import SynthwaveSelect from "@/components/ui/synthwave-select";
import {
  CLASS_OPTIONS,
  LOCATION_SUGGESTIONS,
  PLAYER_TYPE_OPTIONS,
  RACE_OPTIONS,
} from "@/lib/characters/constants";

export default function NewCharacterPage() {
  return (
    <Suspense fallback={null}>
      <NewCharacterForm />
    </Suspense>
  );
}

const RACE_STORAGE_KEY = "character-race-options";
const CLASS_STORAGE_KEY = "character-class-options";

function NewCharacterForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const [playerType, setPlayerType] = useState<"npc" | "player">("npc");
  const [race, setRace] = useState("");
  const [characterClass, setCharacterClass] = useState("");

  const toTitleCase = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    return trimmed
      .split(/\s+/)
      .map((word) =>
        word
          .split(/([-'])/)
          .map((segment) => {
            if (segment === "-" || segment === "'") {
              return segment;
            }
            if (!segment) {
              return segment;
            }
            return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
          })
          .join("")
      )
      .join(" ");
  }, []);

  const levelLabel = playerType === "player" ? "Level" : "Challenge Rating";
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Create New Character</h1>
        <p className="mt-2 text-gray-400 font-mono">Add a new character to your campaign</p>
      </div>

      <form
        action={createCharacter}
        encType="multipart/form-data"
        className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 space-y-8"
      >
        {redirectTo ? (
          <input type="hidden" name="redirect_to" value={redirectTo} />
        ) : null}

        <ImageUpload name="image" label="Character Portrait" maxSize={5} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Character Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="race"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Race
            </label>
            <CreatableSelect
              id="race"
              name="race"
              value={race}
              onChange={(next) => setRace(next ? toTitleCase(next) : "")}
              options={RACE_OPTIONS}
              placeholder="Select or create a race"
              storageKey={RACE_STORAGE_KEY}
              normalizeOption={toTitleCase}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="class"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Class
            </label>
            <CreatableSelect
              id="class"
              name="class"
              value={characterClass}
              onChange={(next) => setCharacterClass(next ? toTitleCase(next) : "")}
              options={CLASS_OPTIONS}
              placeholder="Select or create a class"
              storageKey={CLASS_STORAGE_KEY}
              normalizeOption={toTitleCase}
            />
          </div>

          <div>
            <label
              htmlFor="player_type"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Player Type
            </label>
            <SynthwaveSelect
              id="player_type"
              name="player_type"
              value={playerType}
              onChange={(event) => setPlayerType(event.target.value as "npc" | "player")}
            >
              {PLAYER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SynthwaveSelect>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="level"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              {levelLabel}
            </label>
            <input
              type="text"
              id="level"
              name="level"
              className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="last_known_location"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Last Known Location
            </label>
            <input
              type="text"
              id="last_known_location"
              name="last_known_location"
              list="last-known-location-options"
              className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
              placeholder="Where were they last seen?"
            />
            <datalist id="last-known-location-options">
              {LOCATION_SUGGESTIONS.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Backstory */}
        <div>
          <label
            htmlFor="backstory"
            className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
          >
            Backstory & Notes
          </label>
          <AutoResizeTextarea
            id="backstory"
            name="backstory"
            rows={6}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            placeholder="Character background, personality, goals..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <button
            type="submit"
            className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-black bg-[#ff00ff] hover:bg-[#cc00cc] focus:outline-none focus:ring-2 focus:ring-[#ff00ff] transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[#ff00ff]/50"
          >
            Create Character
          </button>
          <Link
            href="/characters"
            className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-[#00ffff] border border-[#00ffff] border-opacity-30 hover:bg-[#1a1a3e] hover:border-[#ff00ff] hover:text-[#ff00ff] focus:outline-none transition-all duration-200 uppercase tracking-wider text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
