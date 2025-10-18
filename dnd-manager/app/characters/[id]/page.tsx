import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteCharacter, updateCharacterSessions } from '@/lib/actions/characters'
import { DeleteCharacterButton } from '@/components/ui/delete-character-button'
import MultiSelectDropdown from '@/components/ui/multi-select-dropdown'

type SessionSummary = {
  id: string
  name: string
  session_date: string | null
  campaign: {
    id: string
    name: string
  } | null
}

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (!character) {
    notFound()
  }

  // Get sessions this character was in
  const { data: sessionCharacters } = await supabase
    .from('session_characters')
    .select('session_id')
    .eq('character_id', id)

  const sessionIds = sessionCharacters?.map(sc => sc.session_id) || []
  const linkedSessionIds = new Set(sessionIds)

  const { data: allSessionsData } = await supabase
    .from('sessions')
    .select('id, name, session_date, campaign:campaigns(id, name)')
    .order('session_date', { ascending: false })

  const allSessions: SessionSummary[] = (allSessionsData || []).map((session: any) => ({
    id: session.id,
    name: session.name,
    session_date: session.session_date,
    campaign: Array.isArray(session.campaign)
      ? session.campaign[0] ?? null
      : session.campaign ?? null,
  }))
  const linkedSessions = allSessions.filter(session => linkedSessionIds.has(session.id))

  const deleteCharacterWithId = deleteCharacter.bind(null, id)
  const updateCharacterSessionsWithId = updateCharacterSessions.bind(null, id)

  const dropdownOptions = allSessions.map((session) => ({
    id: session.id,
    label: session.name,
    subLabel: session.session_date
      ? new Date(session.session_date).toLocaleDateString()
      : null,
    checked: linkedSessionIds.has(session.id),
  }))

  async function handleSessionUpdate(selectedIds: string[]) {
    'use server'
    const formData = new FormData()
    const uniqueSelections = Array.from(new Set(selectedIds)).filter(Boolean)
    uniqueSelections.forEach((sessionId) => formData.append('session_ids', sessionId))
    await updateCharacterSessionsWithId(formData)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <Link href="/characters" className="text-[#00ffff] hover:text-[#ff00ff] font-mono uppercase tracking-wider">
          ← Back to Characters
        </Link>
        <div className="flex gap-4">
          <Link
            href={`/characters/${id}/edit`}
            className="bg-[#ff00ff] text-black px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
          >
            Edit Character
          </Link>
          <form action={deleteCharacterWithId}>
            <DeleteCharacterButton />
          </form>
        </div>
      </div>

      <div className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-8 space-y-6">
        <header>
          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest text-[#e8faff] drop-shadow-[0_0_8px_rgba(0,255,255,0.35)]">
            {character.name}
          </h1>
        </header>

        <div className="md:flow-root space-y-6 md:space-y-0">
          {/* Infobox floats right just like the reference layout */}
          <aside className="md:float-right md:w-72 md:ml-8 md:mb-4 w-full max-w-xs rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-lg shadow-[#00ffff]/20 font-mono text-sm text-gray-200">
            <div className="p-4 space-y-4">
              {character.image_url && (
                <div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded border border-[#00ffff] border-opacity-30 bg-black">
                    <Image
                      src={character.image_url}
                      alt={character.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <p className="mt-2 text-center text-xs uppercase tracking-widest text-gray-400">{character.name || 'Unknown'}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h2 className="text-[#00ffff] text-base font-semibold uppercase tracking-wider">Character Details</h2>
                </div>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">Race</dt>
                    <dd className="text-right text-[#f0f0ff]">{character.race || 'Unknown'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">Class</dt>
                    <dd className="text-right text-[#f0f0ff]">{character.class || 'Untrained'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-400 uppercase tracking-widest text-[10px]">Level</dt>
                    <dd className="text-right text-[#f0f0ff]">{character.level ?? '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>

          {/* Backstory text now wraps around the infobox */}
          <section className="text-gray-300 font-mono leading-relaxed space-y-4">
            <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Backstory & Notes</h3>
            {character.backstory ? (
              <p className="whitespace-pre-wrap">{character.backstory}</p>
            ) : (
              <p className="text-gray-500 italic">No backstory provided yet.</p>
            )}
          </section>

          <div className="clear-both" />
        </div>

        {/* Sessions */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-xl font-bold text-[#00ffff] uppercase tracking-wider">Sessions</h3>
            {allSessions.length > 0 ? (
              /* Dropdown control to link/unlink sessions without large inline form */
              <MultiSelectDropdown
                label="Manage Sessions"
                options={dropdownOptions}
                onSubmit={handleSessionUpdate}
                emptyMessage="No sessions available"
                submitLabel="Save Sessions"
                className="md:w-60 w-full md:shrink-0"
                menuWidthClass="w-60"
              />
            ) : (
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider md:text-right">Create a session to link it.</p>
            )}
          </div>

          {linkedSessions.length > 0 ? (
            <div className="space-y-3">
              {linkedSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block p-4 border border-[#00ffff] border-opacity-20 rounded hover:border-[#ff00ff] hover:bg-[#0f0f23] transition-all duration-200"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="font-medium text-[#00ffff] font-mono text-lg">{session.name}</h4>
                      {session.campaign?.name && (
                        <span className="text-xs uppercase tracking-wider text-[#ff00ff] font-semibold">
                          {session.campaign.name}
                        </span>
                      )}
                    </div>
                    {session.session_date && (
                      <span className="text-sm text-gray-400 font-mono uppercase tracking-wider text-right">
                        {new Date(session.session_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 font-mono italic">No related sessions yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
