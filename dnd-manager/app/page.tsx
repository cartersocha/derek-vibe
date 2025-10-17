import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          D&D Campaign Manager
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Organize your campaigns, track sessions, and manage characters all in one place
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">📚 Campaigns</h3>
            <p className="text-gray-600">Create and organize multiple campaign storylines</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">🎲 Sessions</h3>
            <p className="text-gray-600">Track session notes, dates, and attached characters</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">⚔️ Characters</h3>
            <p className="text-gray-600">Manage character details, stats, and backstories</p>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  )
}
