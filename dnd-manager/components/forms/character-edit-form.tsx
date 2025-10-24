'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ImageUpload from '@/components/ui/image-upload'
import CreatableSelect from '@/components/ui/creatable-select'
import SynthwaveDropdown from '@/components/ui/synthwave-dropdown'
import OrganizationMultiSelect from '@/components/ui/organization-multi-select'
import {
  CHARACTER_STATUS_OPTIONS,
  CLASS_OPTIONS,
  LOCATION_SUGGESTIONS,
  PLAYER_TYPE_OPTIONS,
  RACE_OPTIONS,
  type CharacterStatus,
} from '@/lib/characters/constants'
import MentionableTextarea from '@/components/ui/mentionable-textarea'
import type { MentionTarget } from '@/lib/mention-utils'

interface Character {
  id: string
  name: string
  race: string | null
  class: string | null
  level: string | null
  backstory: string | null
  image_url: string | null
  player_type: 'npc' | 'player'
  last_known_location: string | null
  status: CharacterStatus
}

interface CharacterEditFormProps {
  action: (formData: FormData) => Promise<void>
  character: Character
  cancelHref?: string
  mentionTargets: MentionTarget[]
  organizations: { id: string; name: string }[]
  organizationAffiliations?: string[]
  locationSuggestions?: string[]
  raceSuggestions?: string[]
  classSuggestions?: string[]
}

const RACE_STORAGE_KEY = 'character-race-options'
const CLASS_STORAGE_KEY = 'character-class-options'
const LOCATION_STORAGE_KEY = 'character-location-options'

export default function CharacterEditForm({
  action,
  character,
  cancelHref,
  mentionTargets,
  organizations,
  organizationAffiliations,
  locationSuggestions = [],
  raceSuggestions = [],
  classSuggestions = [],
}: CharacterEditFormProps) {
  const toTitleCase = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return ''
    }

    return trimmed
      .split(/\s+/)
      .map((word) =>
        word
          .split(/([-'])/)
          .map((segment) => {
            if (segment === '-' || segment === "'") {
              return segment
            }
            if (!segment) {
              return segment
            }
            return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
          })
          .join('')
      )
      .join(' ')
  }, [])

  const dedupeAndNormalize = useCallback((values: readonly string[] | string[] | undefined) => {
    const seen = new Set<string>()
    const result: string[] = []
    if (!values) {
      return result
    }
    values.forEach((entry) => {
      const normalized = toTitleCase(entry ?? '')
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

  const locationOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: string[] = []

    const addOption = (input?: string | null) => {
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

    dedupeAndNormalize(LOCATION_SUGGESTIONS).forEach(addOption)
    dedupeAndNormalize(locationSuggestions).forEach(addOption)

    return options.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [dedupeAndNormalize, locationSuggestions, toTitleCase])

  const raceOptions = useMemo(() => {
    const combined = [
      ...dedupeAndNormalize(RACE_OPTIONS),
      ...dedupeAndNormalize(raceSuggestions),
    ]
    return Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [dedupeAndNormalize, raceSuggestions])

  const classOptions = useMemo(() => {
    const combined = [
      ...dedupeAndNormalize(CLASS_OPTIONS),
      ...dedupeAndNormalize(classSuggestions),
    ]
    return Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [classSuggestions, dedupeAndNormalize])

  const [playerType, setPlayerType] = useState<Character['player_type']>(character.player_type ?? 'npc')
  const [race, setRace] = useState(() => toTitleCase(character.race ?? ''))
  const [characterClass, setCharacterClass] = useState(() => toTitleCase(character.class ?? ''))
  const [lastKnownLocation, setLastKnownLocation] = useState(() => toTitleCase(character.last_known_location ?? ''))
  const [status, setStatus] = useState<CharacterStatus>(character.status ?? 'alive')
  const [organizationList, setOrganizationList] = useState(() => [...organizations])
  const allowedOrganizationIds = useMemo(() => {
    const allowed = new Set(organizationList.map((organization) => organization.id))
    return (organizationAffiliations ?? []).filter((organizationId) => allowed.has(organizationId))
  }, [organizationAffiliations, organizationList])
  const [organizationIds, setOrganizationIds] = useState<string[]>(allowedOrganizationIds)

  const organizationMentionTargets = useMemo(() => {
    return organizationList
      .filter((organization) => Boolean(organization.name))
      .map((organization) => ({
        id: organization.id,
        name: organization.name,
        href: `/organizations/${organization.id}`,
        kind: 'organization' as const,
      }))
  }, [organizationList])

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

  useEffect(() => {
    setOrganizationList((previous) => {
      const merged = new Map(previous.map((organization) => [organization.id, organization]))
      organizations.forEach((organization) => {
        if (organization?.id) {
          merged.set(organization.id, { id: organization.id, name: organization.name })
        }
      })
      return Array.from(merged.values()).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }))
    })
  }, [organizations])

  useEffect(() => {
    setOrganizationIds((prev) => {
      const merged = new Set(prev)
      let updated = false
      for (const id of allowedOrganizationIds) {
        if (!merged.has(id)) {
          merged.add(id)
          updated = true
        }
      }
      return updated ? Array.from(merged) : prev
    })
  }, [allowedOrganizationIds])

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

  const organizationOptions = useMemo(() => {
    return organizationList.map((organization) => ({
      value: organization.id,
      label: organization.name || 'Untitled Organization',
    }))
  }, [organizationList])

  const handleRaceChange = useCallback((next: string) => {
    setRace(next ? toTitleCase(next) : '')
  }, [toTitleCase])

  const handleClassChange = useCallback((next: string) => {
    setCharacterClass(next ? toTitleCase(next) : '')
  }, [toTitleCase])

  const handleLocationChange = useCallback((next: string) => {
    setLastKnownLocation(next ? toTitleCase(next) : '')
  }, [toTitleCase])

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
          kind: 'organization' as const,
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
        setOrganizationList((prev) => {
          if (prev.some((org) => org.id === target.id)) {
            return prev
          }
          const next = [...prev, { id: target.id, name: target.name }]
          return next.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }))
        })

        // Auto-assign the organization to the character
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

  const levelLabel = playerType === 'player' ? 'Level' : 'Challenge Rating'

  return (
    <form
      action={action}
      className="bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl p-6 space-y-8"
    >
      <input type="hidden" name="organization_field_present" value="true" />
      <ImageUpload
        name="image"
        label="Character Portrait"
        currentImage={character.image_url}
        maxSize={5}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
            Character Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={character.name}
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
            onChange={handleRaceChange}
            options={raceOptions}
            placeholder="Select or create a race"
            storageKey={RACE_STORAGE_KEY}
            normalizeOption={toTitleCase}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label htmlFor="class" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
            Class
          </label>
          <CreatableSelect
            id="class"
            name="class"
            value={characterClass}
            onChange={handleClassChange}
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
            onChange={(next) => setPlayerType(next as Character['player_type'])}
            options={PLAYER_TYPE_OPTIONS}
            hideSearch
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
            defaultValue={character.level || ''}
            className="w-full px-4 py-3 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 text-[var(--cyber-cyan)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] focus:border-transparent font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label htmlFor="last_known_location" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
            Last Known Location
          </label>
          <CreatableSelect
            id="last_known_location"
            name="last_known_location"
            value={lastKnownLocation}
            onChange={handleLocationChange}
            options={locationOptions}
            placeholder="Select or create a location"
            storageKey={LOCATION_STORAGE_KEY}
            normalizeOption={toTitleCase}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="organization_ids" className="block text-sm font-bold text-[var(--cyber-cyan)] uppercase tracking-wider">
            Group Affiliation
          </label>
          <OrganizationMultiSelect
            id="organization_ids"
            name="organization_ids"
            value={organizationIds}
            onChange={setOrganizationIds}
            options={organizationOptions}
            placeholder="Select groups"
            onCreateOption={handleOrganizationCreated}
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
          initialValue={character.backstory || ''}
          mentionTargets={mentionableTargets}
          onMentionInsert={handleMentionInsert}
          className="w-full px-4 py-3 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 text-[var(--cyber-cyan)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] focus:border-transparent font-mono"
          spellCheck
        />
        <p className="mt-2 text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">
          Use @ to mention characters or sessions. Mentioned sessions are linked automatically.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-black bg-[var(--cyber-magenta)] hover:bg-[var(--cyber-magenta)]/80 focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)] transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[var(--cyber-magenta)]/50"
        >
          Save Changes
        </button>
        <Link
          href={cancelHref || '/characters'}
          className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-[var(--cyber-cyan)] border border-[var(--cyber-cyan)] border-opacity-30 hover:bg-[var(--bg-card)] hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)] focus:outline-none transition-all duration-200 uppercase tracking-wider text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
