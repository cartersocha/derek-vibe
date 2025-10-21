"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import ImageUpload from "@/components/ui/image-upload"
import CreatableSelect from "@/components/ui/creatable-select"
import SynthwaveDropdown from "@/components/ui/synthwave-dropdown"
import OrganizationMultiSelect from "@/components/ui/organization-multi-select"
import MentionableTextarea from "@/components/ui/mentionable-textarea"
import { createCharacter } from "@/lib/actions/characters"
import {
  CHARACTER_STATUS_OPTIONS,
  CLASS_OPTIONS,
  LOCATION_SUGGESTIONS,
  PLAYER_TYPE_OPTIONS,
  RACE_OPTIONS,
  type CharacterStatus,
} from "@/lib/characters/constants"
import type { MentionTarget } from "@/lib/mention-utils"

const RACE_STORAGE_KEY = "character-race-options"
const CLASS_STORAGE_KEY = "character-class-options"
const LOCATION_STORAGE_KEY = "character-location-options"

type NewCharacterFormProps = {
  redirectTo?: string | null
  mentionTargets: MentionTarget[]
  organizations: { id: string; name: string }[]
  locationSuggestions?: string[]
  raceSuggestions?: string[]
  classSuggestions?: string[]
}

export function NewCharacterForm({
  redirectTo,
  mentionTargets,
  organizations,
  locationSuggestions = [],
  raceSuggestions = [],
  classSuggestions = [],
}: NewCharacterFormProps) {
  const [playerType, setPlayerType] = useState<"npc" | "player">("npc")
  const [race, setRace] = useState("")
  const [characterClass, setCharacterClass] = useState("")
  const [lastKnownLocation, setLastKnownLocation] = useState("")
  const [status, setStatus] = useState<CharacterStatus>("alive")
  const [organizationIds, setOrganizationIds] = useState<string[]>([])
  const organizationMentionTargets = useMemo(() => {
    return organizations
      .filter((organization) => Boolean(organization.name))
      .map((organization) => ({
        id: organization.id,
        name: organization.name,
        href: `/organizations/${organization.id}`,
        kind: "organization" as const,
      }))
  }, [organizations])

  const baseMentionTargets = useMemo(() => {
    const merged = new Map<string, MentionTarget>()
    mentionTargets.forEach((target) => {
      merged.set(target.id, target)
    })
    organizationMentionTargets.forEach((target) => {
      merged.set(target.id, target)
    })
    return Array.from(merged.values())
  }, [mentionTargets, organizationMentionTargets])

  const [mentionableTargets, setMentionableTargets] = useState<MentionTarget[]>(baseMentionTargets)

  const toTitleCase = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return ""
    }

    return trimmed
      .split(/\s+/)
      .map((word) =>
        word
          .split(/([-'])/)
          .map((segment) => {
            if (segment === "-" || segment === "'") {
              return segment
            }
            if (!segment) {
              return segment
            }
            return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
          })
          .join("")
      )
      .join(" ")
  }, [])

  const organizationOptions = useMemo(() => {
    return organizations.map((organization) => ({
      value: organization.id,
      label: organization.name || "Untitled Organization",
    }))
  }, [organizations])

  const dedupeAndNormalize = useCallback((values: readonly string[] | string[] | undefined) => {
    const seen = new Set<string>()
    const result: string[] = []
    if (!values) {
      return result
    }
    values.forEach((entry) => {
      const normalized = toTitleCase(entry ?? "")
      if (!normalized) {
        return
      }
      const key = normalized.toLowerCase()
      if (seen.has(key)) {
        return
      }
      seen.add(key)
      result.push(normalized)
    })
    return result
  }, [toTitleCase])

  const raceOptions = useMemo(() => {
    const combined = [
      ...dedupeAndNormalize(RACE_OPTIONS),
      ...dedupeAndNormalize(raceSuggestions),
    ]
    return Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [dedupeAndNormalize, raceSuggestions])

  const classOptions = useMemo(() => {
    const combined = [
      ...dedupeAndNormalize(CLASS_OPTIONS),
      ...dedupeAndNormalize(classSuggestions),
    ]
    return Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [classSuggestions, dedupeAndNormalize])

  useEffect(() => {
    setMentionableTargets((previous) => {
      const merged = new Map<string, MentionTarget>()
      baseMentionTargets.forEach((target) => {
        merged.set(target.id, target)
      })
      previous.forEach((target) => {
        if (!merged.has(target.id)) {
          merged.set(target.id, target)
        }
      })
      return Array.from(merged.values())
    })
  }, [baseMentionTargets])

  const handleOrganizationCreated = useCallback((option: { value: string; label: string }) => {
    setMentionableTargets((previous) => {
      if (previous.some((target) => target.id === option.value)) {
        return previous
      }
      return [
        ...previous,
        {
          id: option.value,
          name: option.label,
          href: `/organizations/${option.value}`,
          kind: "organization" as const,
        },
      ]
    })
  }, [])

  const handleMentionInsert = useCallback(
    (target: MentionTarget) => {
      setMentionableTargets((previous) => {
        if (previous.some((entry) => entry.id === target.id)) {
          return previous
        }
        return [...previous, target]
      })

      if (target.kind === 'organization') {
        // Add organization to the list if not already present
        setOrganizationIds((prev) => {
          if (prev.includes(target.id)) {
            return prev
          }
          return [...prev, target.id]
        })
      }
    },
    []
  )

  const locationOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: string[] = []

    const pushOption = (input?: string | null) => {
      if (!input) {
        return
      }
      const normalized = toTitleCase(input)
      if (!normalized) {
        return
      }
      const key = normalized.toLowerCase()
      if (seen.has(key)) {
        return
      }
      seen.add(key)
      options.push(normalized)
    }

    dedupeAndNormalize(LOCATION_SUGGESTIONS).forEach(pushOption)
    dedupeAndNormalize(locationSuggestions).forEach(pushOption)

    return options.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [dedupeAndNormalize, locationSuggestions, toTitleCase])

  const levelLabel = playerType === "player" ? "Level" : "Challenge Rating"

  return (
    <form
      action={createCharacter}
      className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 space-y-8"
    >
      {redirectTo ? <input type="hidden" name="redirect_to" value={redirectTo} /> : null}
      <input type="hidden" name="organization_field_present" value="true" />

      <ImageUpload name="image" label="Character Portrait" maxSize={5} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
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
          <label htmlFor="race" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Race
          </label>
          <CreatableSelect
            id="race"
            name="race"
            value={race}
            onChange={(next) => setRace(next ? toTitleCase(next) : "")}
            options={raceOptions}
            placeholder="Select or create a race"
            storageKey={RACE_STORAGE_KEY}
            normalizeOption={toTitleCase}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="class" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Class
          </label>
          <CreatableSelect
            id="class"
            name="class"
            value={characterClass}
            onChange={(next) => setCharacterClass(next ? toTitleCase(next) : "")}
            options={classOptions}
            placeholder="Select or create a class"
            storageKey={CLASS_STORAGE_KEY}
            normalizeOption={toTitleCase}
          />
        </div>

        <div>
          <label htmlFor="player_type" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Player Type
          </label>
          <SynthwaveDropdown
            id="player_type"
            name="player_type"
            value={playerType}
            onChange={(next) => setPlayerType(next as "npc" | "player")}
            options={PLAYER_TYPE_OPTIONS}
            hideSearch
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="status" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Status
          </label>
          <SynthwaveDropdown
            id="status"
            name="status"
            value={status}
            onChange={(next) => setStatus(next as CharacterStatus)}
            options={CHARACTER_STATUS_OPTIONS}
            hideSearch
          />
        </div>

        <div>
          <label htmlFor="level" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            {levelLabel}
          </label>
          <input
            type="text"
            id="level"
            name="level"
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="last_known_location" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Last Known Location
          </label>
          <CreatableSelect
            id="last_known_location"
            name="last_known_location"
            value={lastKnownLocation}
            onChange={(next) => setLastKnownLocation(next ? toTitleCase(next) : "")}
            options={locationOptions}
            placeholder="Select or create a location"
            storageKey={LOCATION_STORAGE_KEY}
            normalizeOption={toTitleCase}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="organization_ids" className="block text-sm font-bold text-[#00ffff] uppercase tracking-wider">
            Organization Affiliation
          </label>
          <OrganizationMultiSelect
            id="organization_ids"
            name="organization_ids"
            value={organizationIds}
            onChange={setOrganizationIds}
            options={organizationOptions}
            placeholder="Select organizations"
            onCreateOption={handleOrganizationCreated}
          />
        </div>
      </div>
      <div>
        <label htmlFor="backstory" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Backstory & Notes
        </label>
        <MentionableTextarea
          id="backstory"
          name="backstory"
          rows={6}
          initialValue=""
          mentionTargets={mentionableTargets}
          onMentionInsert={handleMentionInsert}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          placeholder="Character background, personality, goals..."
          spellCheck
        />
        <p className="mt-2 text-xs text-gray-500 font-mono uppercase tracking-wider">
          Use @ to mention characters or sessions. Mentioned sessions are linked automatically.
        </p>
      </div>

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
  )
}
