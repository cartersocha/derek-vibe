"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import ImageUpload from "@/components/ui/image-upload"
import CreatableSelect from "@/components/ui/creatable-select"
import SynthwaveDropdown from "@/components/ui/synthwave-dropdown"
import GroupMultiSelect from "@/components/ui/group-multi-select"
import MentionableTextarea from "@/components/ui/mentionable-textarea"
import SimpleCampaignMultiSelect from "@/components/ui/simple-campaign-multi-select"
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
  groups: { id: string; name: string }[]
  campaigns?: { id: string; name: string }[]
  locationSuggestions?: string[]
  raceSuggestions?: string[]
  classSuggestions?: string[]
}

export function NewCharacterForm({
  redirectTo,
  mentionTargets,
  groups,
  campaigns = [],
  locationSuggestions = [],
  raceSuggestions = [],
  classSuggestions = [],
}: NewCharacterFormProps) {
  const [playerType, setPlayerType] = useState<"npc" | "player">("npc")
  const [race, setRace] = useState("")
  const [characterClass, setCharacterClass] = useState("")
  const [lastKnownLocation, setLastKnownLocation] = useState("")
  const [status, setStatus] = useState<CharacterStatus>("alive")
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [campaignIds, setCampaignIds] = useState<string[]>(() => {
    // Default to most recently created campaign if provided
    if (campaigns && campaigns.length > 0) {
      return [campaigns[0].id]
    }
    return []
  })
  const groupMentionTargets = useMemo(() => {
    return groups
      .filter((group) => Boolean(group.name))
      .map((group) => ({
        id: group.id,
        name: group.name,
        href: `/groups/${group.id}`,
        kind: "group" as const,
      }))
  }, [groups])

  const baseMentionTargets = useMemo(() => {
    const merged = new Map<string, MentionTarget>()
    mentionTargets.forEach((target) => {
      merged.set(target.id, target)
    })
    groupMentionTargets.forEach((target) => {
      merged.set(target.id, target)
    })
    return Array.from(merged.values())
  }, [mentionTargets, groupMentionTargets])

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

  const groupOptions = useMemo(() => {
    return groups.map((group) => ({
      value: group.id,
      label: group.name || "Untitled Group",
    }))
  }, [groups])

  const campaignOptions = useMemo(() => {
    return (campaigns ?? []).map((campaign) => ({
      value: campaign.id,
      label: campaign.name || "Untitled Campaign",
    }))
  }, [campaigns])

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

  const handleGroupCreated = useCallback((option: { value: string; label: string }) => {
    setMentionableTargets((previous) => {
      if (previous.some((target) => target.id === option.value)) {
        return previous
      }
      return [
        ...previous,
        {
          id: option.value,
          name: option.label,
          href: `/groups/${option.value}`,
          kind: "group" as const,
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

      if (target.kind === 'group') {
        // Add group to the list if not already present
        setGroupIds((prev) => {
          if (prev.includes(target.id)) {
            return prev
          }
          return [...prev, target.id]
        })
      } else if (target.kind === 'campaign') {
        setCampaignIds((prev) => {
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
      className="bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl p-6 space-y-8"
    >
      {redirectTo ? <input type="hidden" name="redirect_to" value={redirectTo} /> : null}
      <input type="hidden" name="group_field_present" value="true" />

      <ImageUpload name="image" label="Character Portrait" maxSize={5} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
            Character Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-3 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 text-[var(--cyber-cyan)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] focus:border-transparent font-mono"
          />
        </div>

        <div>
          <label htmlFor="race" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
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
          <label htmlFor="class" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
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
          <label htmlFor="player_type" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
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
          <label htmlFor="status" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
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
          <label htmlFor="level" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
            {levelLabel}
          </label>
          <input
            type="text"
            id="level"
            name="level"
            className="w-full px-4 py-3 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 text-[var(--cyber-cyan)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] focus:border-transparent font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="last_known_location" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
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
          <label htmlFor="group_ids" className="block text-sm font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">
            Group Affiliation
          </label>
          <GroupMultiSelect
            id="group_ids"
            name="group_ids"
            value={groupIds}
            onChange={setGroupIds}
            options={groupOptions}
            placeholder="Select groups"
            onCreateOption={handleGroupCreated}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="campaign_ids" className="block text-sm font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">
            Campaigns
          </label>
          <SimpleCampaignMultiSelect
            id="campaign_ids"
            name="campaign_ids"
            value={campaignIds}
            onChange={setCampaignIds}
            options={campaignOptions}
            placeholder="Select campaigns"
            emptyMessage="No campaigns available"
          />
        </div>
      </div>
      <div>
        <label htmlFor="backstory" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
          Backstory & Notes
        </label>
        <MentionableTextarea
          id="backstory"
          name="backstory"
          rows={6}
          initialValue=""
          mentionTargets={mentionableTargets}
          onMentionInsert={handleMentionInsert}
          className="w-full px-4 py-3 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 text-[var(--cyber-cyan)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] focus:border-transparent font-mono"
          placeholder="Character background, personality, goals..."
          spellCheck
        />
        <p className="mt-2 text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">
          Use @ to mention characters or sessions. Mentioned sessions are linked automatically.
        </p>
      </div>

      <div className="flex flex-col gap-4 pt-4 sm:flex-row">
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-black bg-[var(--cyber-magenta)] hover:bg-[var(--cyber-magenta)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)] transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[var(--cyber-magenta)]/50"
        >
          Create Character
        </button>
        <Link
          href="/characters"
          className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-[var(--cyber-cyan)] border border-[var(--cyber-cyan)] border-opacity-30 hover:bg-[var(--bg-card)] hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)] focus:outline-none transition-all duration-200 uppercase tracking-wider text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
