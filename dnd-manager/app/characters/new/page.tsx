import { createCharacter } from '@/lib/actions/characters'
import Link from 'next/link'

export default function NewCharacterPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Character</h1>
        <p className="mt-2 text-gray-600">Add a new character to your roster</p>
      </div>

      <form action={createCharacter} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Character Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter character name"
            />
          </div>

          <div>
            <label htmlFor="race" className="block text-sm font-medium text-gray-700 mb-2">
              Race
            </label>
            <input
              type="text"
              id="race"
              name="race"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Human, Elf, Dwarf"
            />
          </div>

          <div>
            <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <input
              type="text"
              id="class"
              name="class"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Fighter, Wizard, Rogue"
            />
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <input
              type="number"
              id="level"
              name="level"
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1-20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="backstory" className="block text-sm font-medium text-gray-700 mb-2">
            Backstory
          </label>
          <textarea
            id="backstory"
            name="backstory"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about your character..."
          />
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ability Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((ability) => (
              <div key={ability}>
                <label htmlFor={ability} className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {ability}
                </label>
                <input
                  type="number"
                  id={ability}
                  name={ability}
                  min="1"
                  max="30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1-30"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Character
          </button>
          <Link
            href="/characters"
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
