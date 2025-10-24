import { createSession } from '@/lib/actions/sessions'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'
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
    supabase.from('campaigns').select('id, name, created_at').order('created_at', { ascending: false }),
    supabase.from('characters').select(`
      id,
      name,
      race,
      class,
      organization_memberships:organization_characters(
        organizations(id, name)
      )
    `).order('name'),
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

  // Transform character data to include organizations
  type CharacterRow = {
    id: string
    name: string
    race: string | null
    class: string | null
    organization_memberships: Array<{
      organizations: { id: string; name: string } | Array<{ id: string; name: string }>
    }> | null
  }

  const charactersWithOrgs = (characters as CharacterRow[] | null)?.map((character) => {
    const organizations: Array<{ id: string; name: string }> = []
    
    if (character.organization_memberships) {
      character.organization_memberships.forEach((membership) => {
        const orgData = membership.organizations
        const org = Array.isArray(orgData) ? orgData[0] : orgData
        if (org?.id && org?.name) {
          organizations.push({ id: org.id, name: org.name })
        }
      })
    }

    return {
      id: character.id,
      name: character.name,
      race: character.race,
      class: character.class,
      organizations,
    }
  }) || []

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersWithOrgs, 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(sessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(organizations, 'organization', (entry) => `/organizations/${entry.id}`),
    mapEntitiesToMentionTargets(campaigns, 'campaign', (entry) => `/campaigns/${entry.id}`)
  )

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="retro-title text-xl sm:text-2xl md:text-3xl font-bold text-[var(--cyber-cyan)] break-words">Create New Session</h1>
      </div>

      <SessionForm
        action={createSession}
        campaigns={campaigns || []}
        characters={charactersWithOrgs}
        organizations={organizations || []}
        defaultCampaignId={defaultCampaignId || undefined}
        submitLabel="Create Session"
        cancelHref="/sessions"
        draftKey={draftKey}
        preselectedCharacterIds={newCharacterId ? [newCharacterId] : undefined}
        mentionTargets={mentionTargets}
      />
    </div>
  )
}
