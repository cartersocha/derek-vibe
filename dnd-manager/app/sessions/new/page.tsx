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

  const [{ data: campaigns }, { data: characters }, { data: sessions }, { data: organizations }] = await Promise.all([
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('characters').select('id, name, race, class').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
  ])

  const campaignList = campaigns ?? []
  const campaignFromParams = typeof params.campaign_id === 'string' ? params.campaign_id.trim() : ''
  const defaultCampaignId = campaignFromParams || campaignList[0]?.id

  const draftKey = defaultCampaignId
    ? `session-notes:new:${defaultCampaignId}`
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

  if (!campaignFromParams && defaultCampaignId) {
    sessionQuery.set('campaign_id', defaultCampaignId)
  }

  const sessionPath = `/sessions/new${sessionQuery.toString() ? `?${sessionQuery.toString()}` : ''}`
  const newCharacterHref = `/characters/new?${new URLSearchParams({ redirectTo: sessionPath }).toString()}`
  const newGroupHref = `/organizations/new?${new URLSearchParams({ redirectTo: sessionPath }).toString()}`

  const mentionTargets = [
    ...(characters ?? [])
      .filter((entry): entry is { id: string; name: string; race: string | null; class: string | null } => Boolean(entry?.name))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        href: `/characters/${entry.id}`,
        kind: 'character' as const,
      })),
    ...(sessions ?? [])
      .filter((entry): entry is { id: string; name: string } => Boolean(entry?.name))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        href: `/sessions/${entry.id}`,
        kind: 'session' as const,
      })),
    ...(organizations ?? [])
      .filter((entry): entry is { id: string; name: string } => Boolean(entry?.name))
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        href: `/organizations/${entry.id}`,
        kind: 'organization' as const,
      })),
  ].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

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
        organizations={organizations || []}
        defaultCampaignId={defaultCampaignId || undefined}
        submitLabel="Create Session"
        cancelHref="/sessions"
        draftKey={draftKey}
        newCharacterHref={newCharacterHref}
        newGroupHref={newGroupHref}
        preselectedCharacterIds={newCharacterId ? [newCharacterId] : undefined}
        mentionTargets={mentionTargets}
      />
    </div>
  )
}
