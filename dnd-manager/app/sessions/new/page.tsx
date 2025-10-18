import { createSession } from '@/lib/actions/sessions'
import { createClient } from '@/lib/supabase/server'
import SessionForm from '@/components/forms/session-form'

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign_id?: string; newCharacterId?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [{ data: campaigns }, { data: characters }] = await Promise.all([
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('characters').select('id, name, race, class').order('name'),
  ])

  const draftKey = params.campaign_id
    ? `session-notes:new:${params.campaign_id}`
    : 'session-notes:new'

  const newCharacterId = params.newCharacterId

  const sessionQuery = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value !== 'string') {
      return
    }
    if (key === 'newCharacterId') {
      return
    }
    sessionQuery.set(key, value)
  })

  const sessionPath = `/sessions/new${sessionQuery.toString() ? `?${sessionQuery.toString()}` : ''}`
  const newCharacterHref = `/characters/new?${new URLSearchParams({ redirectTo: sessionPath }).toString()}`

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#00ffff] uppercase tracking-wider">Create New Session</h1>
        <p className="mt-2 text-gray-400 font-mono">Record a new game session</p>
      </div>

      <SessionForm
        action={createSession}
        campaigns={campaigns || []}
        characters={characters || []}
        defaultCampaignId={params.campaign_id}
        submitLabel="Create Session"
        cancelHref="/sessions"
        draftKey={draftKey}
        newCharacterHref={newCharacterHref}
        preselectedCharacterIds={newCharacterId ? [newCharacterId] : undefined}
      />
    </div>
  )
}
