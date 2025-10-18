'use client'

import { createCharacter } from "@/lib/actions/characters";
import Link from "next/link";
import ImageUpload from "@/components/ui/image-upload";

export default function NewCharacterPage() {
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
        {/* Character Portrait */}
        <ImageUpload
          name="image"
          label="Character Portrait"
          maxSize={5}
        />

        {/* Basic Info */}
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
              placeholder="Enter character name"
            />
          </div>

          <div>
            <label
              htmlFor="level"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Level
            </label>
            <input
              type="number"
              id="level"
              name="level"
              min="1"
              max="20"
              className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
              placeholder="1-20"
            />
          </div>
        </div>

        {/* Race & Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="race"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Race
            </label>
            <select
              id="race"
              name="race"
              className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            >
              <option value="">Select a Race</option>
              <option value="Human">Human</option>
              <option value="Elf">Elf</option>
              <option value="Dwarf">Dwarf</option>
              <option value="Halfling">Halfling</option>
              <option value="Dragonborn">Dragonborn</option>
              <option value="Gnome">Gnome</option>
              <option value="Half-Elf">Half-Elf</option>
              <option value="Half-Orc">Half-Orc</option>
              <option value="Tiefling">Tiefling</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="class"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Class
            </label>
            <select
              id="class"
              name="class"
              className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            >
              <option value="">Select a Class</option>
              <option value="Barbarian">Barbarian</option>
              <option value="Bard">Bard</option>
              <option value="Cleric">Cleric</option>
              <option value="Druid">Druid</option>
              <option value="Fighter">Fighter</option>
              <option value="Monk">Monk</option>
              <option value="Paladin">Paladin</option>
              <option value="Ranger">Ranger</option>
              <option value="Rogue">Rogue</option>
              <option value="Sorcerer">Sorcerer</option>
              <option value="Warlock">Warlock</option>
              <option value="Wizard">Wizard</option>
            </select>
          </div>
        </div>

        {/* Ability Scores */}
        <div>
          <h3 className="text-xl font-bold text-[#00ffff] mb-4 uppercase tracking-wider">Ability Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((ability) => (
              <div key={ability}>
                <label
                  htmlFor={ability}
                  className="block text-xs font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
                >
                  {ability.substring(0, 3)}
                </label>
                <input
                  type="number"
                  id={ability}
                  name={ability}
                  min="1"
                  max="30"
                  placeholder="10"
                  className="w-full px-3 py-2 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono text-center"
                />
              </div>
            ))}
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
          <textarea
            id="backstory"
            name="backstory"
            rows={6}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono resize-none"
            placeholder="Character background, personality, goals..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 py-3 px-6 text-base font-bold rounded text-black bg-[#ff00ff] hover:bg-[#cc00cc] focus:outline-none focus:ring-2 focus:ring-[#ff00ff] transition-all duration-200 uppercase tracking-wider shadow-lg shadow-[#ff00ff]/50"
          >
            Create Character
          </button>
          <Link
            href="/characters"
            className="flex-1 py-3 px-6 text-base font-bold rounded text-[#00ffff] border border-[#00ffff] border-opacity-30 hover:bg-[#1a1a3e] hover:border-[#ff00ff] hover:text-[#ff00ff] focus:outline-none transition-all duration-200 uppercase tracking-wider text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
