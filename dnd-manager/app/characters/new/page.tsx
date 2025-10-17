import { createCharacter } from "@/lib/actions/characters";
import Link from "next/link";

export default function NewCharacterPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <form action={createCharacter} className="space-y-8">
        {/* Character Portrait */}
        <div>
          <label
            htmlFor="image"
            className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
          >
            Character Portrait
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            className="block w-full text-sm text-[#00ffff] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#ff00ff] file:text-black hover:file:bg-[#cc00cc] file:cursor-pointer"
          />
          <p className="mt-1 text-xs text-gray-400">No file selected.</p>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Character Name
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
              htmlFor="status"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            >
              <option value="alive">Alive</option>
              <option value="dead">Dead</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Last Known Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            />
          </div>
        </div>

        {/* Race, Class, Player Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <option value="human">Human</option>
              <option value="elf">Elf</option>
              <option value="dwarf">Dwarf</option>
              <option value="halfling">Halfling</option>
              <option value="dragonborn">Dragonborn</option>
              <option value="gnome">Gnome</option>
              <option value="half-elf">Half-Elf</option>
              <option value="half-orc">Half-Orc</option>
              <option value="tiefling">Tiefling</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Please select an item in the list.
            </p>
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
              <option value="barbarian">Barbarian</option>
              <option value="bard">Bard</option>
              <option value="cleric">Cleric</option>
              <option value="druid">Druid</option>
              <option value="fighter">Fighter</option>
              <option value="monk">Monk</option>
              <option value="paladin">Paladin</option>
              <option value="ranger">Ranger</option>
              <option value="rogue">Rogue</option>
              <option value="sorcerer">Sorcerer</option>
              <option value="warlock">Warlock</option>
              <option value="wizard">Wizard</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="player_type"
              className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider"
            >
              Player Type
            </label>
            <select
              id="player_type"
              name="player_type"
              className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            >
              <option value="player">Player</option>
              <option value="npc">NPC</option>
            </select>
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
            rows={8}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono resize-none"
          />
        </div>

        {/* Link to Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-[#00ffff] uppercase tracking-wider">
              LINK TO SESSIONS
            </h3>
            <button
              type="button"
              className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-[#ff00ff] border border-[#ff00ff] rounded hover:bg-[#ff00ff] hover:text-black transition-all duration-200"
            >
              + Add to Session
            </button>
          </div>
          <p className="text-gray-400 font-mono">No sessions linked yet.</p>
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
