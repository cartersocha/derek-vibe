'use client'

import ImageUpload from '@/components/ui/image-upload'
import Link from 'next/link'

interface Character {
  id: string
  name: string
  race: string | null
  class: string | null
  level: number | null
  backstory: string | null
  image_url: string | null
  strength: number | null
  dexterity: number | null
  constitution: number | null
  intelligence: number | null
  wisdom: number | null
  charisma: number | null
}

interface CharacterEditFormProps {
  action: (formData: FormData) => Promise<void>
  character: Character
  cancelHref?: string
}

export default function CharacterEditForm({ action, character, cancelHref }: CharacterEditFormProps) {
  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 space-y-8"
    >
      {/* Character Portrait */}
      <ImageUpload
        name="image"
        label="Character Portrait"
        currentImage={character.image_url}
        maxSize={5}
      />

      {/* Basic Info */}
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
          <label htmlFor="level" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Level
          </label>
          <input
            type="number"
            id="level"
            name="level"
            min="1"
            max="20"
            defaultValue={character.level || ''}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          />
        </div>
      </div>

      {/* Race & Class */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="race" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Race
          </label>
          <input
            type="text"
            id="race"
            name="race"
            defaultValue={character.race || ''}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          />
        </div>

        <div>
          <label htmlFor="class" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
            Class
          </label>
          <input
            type="text"
            id="class"
            name="class"
            defaultValue={character.class || ''}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          />
        </div>
      </div>

      {/* Ability Scores */}
      <div>
        <h3 className="text-xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Ability Scores</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'strength', value: character.strength },
            { name: 'dexterity', value: character.dexterity },
            { name: 'constitution', value: character.constitution },
            { name: 'intelligence', value: character.intelligence },
            { name: 'wisdom', value: character.wisdom },
            { name: 'charisma', value: character.charisma }
          ].map(({ name, value }) => (
            <div key={name}>
              <label
                htmlFor={name}
                className="block text-xs font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
              >
                {name.substring(0, 3)}
              </label>
              <input
                type="number"
                id={name}
                name={name}
                min="1"
                max="30"
                defaultValue={value || ''}
                placeholder="10"
                className="w-full px-3 py-2 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono text-center"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Backstory */}
      <div>
        <label htmlFor="backstory" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Backstory & Notes
        </label>
        <textarea
          id="backstory"
          name="backstory"
          rows={6}
          defaultValue={character.backstory || ''}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 py-3 px-6 text-base font-bold rounded text-black bg-[#ff00ff] hover:bg-[#cc00cc] focus:outline-none focus:ring-2 focus:ring-[#ff00ff] transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[#ff00ff]/50"
        >
          Save Changes
        </button>
        <Link
          href={cancelHref || "/characters"}
          className="flex-1 py-3 px-6 text-base font-bold rounded text-[#00ffff] border border-[#00ffff] border-opacity-30 hover:bg-[#1a1a3e] hover:border-[#ff00ff] hover:text-[#ff00ff] focus:outline-none transition-all duration-200 uppercase tracking-wider text-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
