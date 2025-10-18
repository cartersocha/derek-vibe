'use client'

import { useState } from 'react'
import Link from 'next/link'
import ImageUpload from '@/components/ui/image-upload'

interface Campaign {
  id: string
  name: string
}

interface Character {
  id: string
  name: string
  race: string | null
  class: string | null
}

interface SessionFormProps {
  action: (formData: FormData) => Promise<void>
  initialData?: {
    name?: string
    campaign_id?: string | null
    session_date?: string | null
    notes?: string | null
    header_image_url?: string | null
    characterIds?: string[]
  }
  campaigns: Campaign[]
  characters: Character[]
  defaultCampaignId?: string
  submitLabel?: string
  cancelHref?: string
}

export default function SessionForm({
  action,
  initialData,
  campaigns,
  characters,
  defaultCampaignId,
  submitLabel = 'Create Session',
  cancelHref = '/sessions'
}: SessionFormProps) {
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(
    new Set(initialData?.characterIds || [])
  )

  const toggleCharacter = (characterId: string) => {
    const newSet = new Set(selectedCharacters)
    if (newSet.has(characterId)) {
      newSet.delete(characterId)
    } else {
      newSet.add(characterId)
    }
    setSelectedCharacters(newSet)
  }

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 space-y-6"
    >
      {/* Header Image Upload */}
      <ImageUpload
        name="header_image"
        label="Session Header Image"
        currentImage={initialData?.header_image_url}
        maxSize={5}
      />

      {/* Session Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Session Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={initialData?.name}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          placeholder="Enter session name"
        />
      </div>

      {/* Campaign Selection */}
      <div>
        <label htmlFor="campaign_id" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Campaign (Optional)
        </label>
        <select
          id="campaign_id"
          name="campaign_id"
          defaultValue={initialData?.campaign_id || defaultCampaignId || ''}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
        >
          <option value="">No campaign</option>
          {campaigns?.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      {/* Session Date */}
      <div>
        <label htmlFor="session_date" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Session Date
        </label>
        <input
          type="date"
          id="session_date"
          name="session_date"
          defaultValue={initialData?.session_date || ''}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
        />
      </div>

      {/* Session Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Session Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={8}
          defaultValue={initialData?.notes || ''}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          placeholder="What happened in this session..."
        />
      </div>

      {/* Characters Present */}
      {characters && characters.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Characters Present
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto border border-[#00ffff] border-opacity-30 rounded p-4 bg-[#0f0f23]">
            {characters.map((character) => (
              <label key={character.id} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="character_ids"
                  value={character.id}
                  checked={selectedCharacters.has(character.id)}
                  onChange={() => toggleCharacter(character.id)}
                  className="rounded border-[#00ffff] border-opacity-30 text-[#ff00ff] focus:ring-[#ff00ff] bg-[#0f0f23]"
                />
                <span className="text-[#00ffff] font-mono group-hover:text-[#ff00ff] transition-colors">
                  {character.name}
                  {character.race && character.class && (
                    <span className="text-gray-500 text-sm ml-2">
                      ({character.race} {character.class})
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-[#ff00ff] text-black px-4 py-3 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="flex-1 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] px-4 py-3 rounded hover:border-[#ff00ff] hover:text-[#ff00ff] transition-all duration-200 text-center font-bold uppercase tracking-wider"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
