'use client'

import { useCallback, useState } from 'react'
import ImageUpload from '@/components/ui/image-upload'
import Link from 'next/link'
import CreatableSelect from '@/components/ui/creatable-select'
import SynthwaveDropdown from '@/components/ui/synthwave-dropdown'
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
}

const RACE_STORAGE_KEY = 'character-race-options'
const CLASS_STORAGE_KEY = 'character-class-options'
const LOCATION_STORAGE_KEY = 'character-location-options'

export default function CharacterEditForm({ action, character, cancelHref, mentionTargets }: CharacterEditFormProps) {
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

  const [playerType, setPlayerType] = useState<Character['player_type']>(character.player_type ?? 'npc')
  const [race, setRace] = useState(() => toTitleCase(character.race ?? ''))
  const [characterClass, setCharacterClass] = useState(() => toTitleCase(character.class ?? ''))
  const [lastKnownLocation, setLastKnownLocation] = useState(() => toTitleCase(character.last_known_location ?? ''))
  const [status, setStatus] = useState<CharacterStatus>(character.status ?? 'alive')

  const handleRaceChange = useCallback((next: string) => {
    setRace(next ? toTitleCase(next) : '')
  }, [toTitleCase])

  const handleClassChange = useCallback((next: string) => {
    setCharacterClass(next ? toTitleCase(next) : '')
  }, [toTitleCase])

  const handleLocationChange = useCallback((next: string) => {
    setLastKnownLocation(next ? toTitleCase(next) : '')
  }, [toTitleCase])

  const levelLabel = playerType === 'player' ? 'Level' : 'Challenge Rating'

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 space-y-8"
    >
      <ImageUpload
        name="image"
        label="Character Portrait"
        currentImage={character.image_url}
        maxSize={5}
      />

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
            defaultValue={character.name}
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
            onChange={handleRaceChange}
            options={RACE_OPTIONS}
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
            onChange={handleClassChange}
            options={CLASS_OPTIONS}
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
            onChange={(next) => setPlayerType(next as Character['player_type'])}
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
            defaultValue={character.level || ''}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          />
        </div>
      </div>

      <div>
        <label htmlFor="last_known_location" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Last Known Location
        </label>
        <CreatableSelect
          id="last_known_location"
          name="last_known_location"
          value={lastKnownLocation}
          onChange={handleLocationChange}
          options={LOCATION_SUGGESTIONS}
          placeholder="Select or create a location"
          storageKey={LOCATION_STORAGE_KEY}
          normalizeOption={toTitleCase}
        />
      </div>

      <div>
        <label htmlFor="backstory" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Backstory & Notes
        </label>
        <MentionableTextarea
          id="backstory"
          name="backstory"
          rows={6}
          initialValue={character.backstory || ''}
          mentionTargets={mentionTargets}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          spellCheck
        />
        <p className="mt-2 text-xs text-gray-500 font-mono uppercase tracking-wider">
          Use @ to mention characters or sessions. Mentioned sessions are linked automatically.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-black bg-[#ff00ff] hover:bg-[#cc00cc] focus:outline-none focus:ring-2 focus:ring-[#ff00ff] transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[#ff00ff]/50"
        >
          Save Changes
        </button>
        <Link
          href={cancelHref || '/characters'}
          className="flex-1 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-bold rounded text-[#00ffff] border border-[#00ffff] border-opacity-30 hover:bg-[#1a1a3e] hover:border-[#ff00ff] hover:text-[#ff00ff] focus:outline-none transition-all duration-200 uppercase tracking-wider text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
