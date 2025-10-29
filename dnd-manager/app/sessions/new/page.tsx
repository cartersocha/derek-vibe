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

  const [{ data: campaigns }, { data: characters }, { data: sessions }, { data: groups }] = await Promise.all([
    supabase.from('campaigns').select('id, name, created_at').order('created_at', { ascending: false }),
    supabase.from('characters').select(`
      id,
      name,
      race,
      class,
      group_memberships:group_characters(
        groups(id, name)
      )
    `).order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('groups').select('id, name').order('name'),
  ])

  const campaignList = campaigns ?? []
  const campaignFromParams = typeof params.campaign_id === 'string' ? params.campaign_id.trim() : ''
  const defaultCampaignId = campaignFromParams || campaignList[0]?.id

  const draftKey = defaultCampaignId
    ? `session-notes:new:${defaultCampaignId}`
    : 'session-notes:new'

  const newCharacterId = params.newCharacterId

  // Transform character data to include groups
  type CharacterRow = {
    id: string
    name: string
    race: string | null
    class: string | null
    group_memberships: Array<{
      groups: { id: string; name: string } | Array<{ id: string; name: string }>
    }> | null
  }

  const charactersWithOrgs = (characters as CharacterRow[] | null)?.map((character) => {
    const groups: Array<{ id: string; name: string }> = []
    
    if (character.group_memberships) {
      character.group_memberships.forEach((membership) => {
        const orgData = membership.groups
        const org = Array.isArray(orgData) ? orgData[0] : orgData
        if (org?.id && org?.name) {
          groups.push({ id: org.id, name: org.name })
        }
      })
    }

    return {
      id: character.id,
      name: character.name,
      race: character.race,
      class: character.class,
      groups,
    }
  }) || []

  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersWithOrgs, 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(sessions, 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(groups, 'group', (entry) => `/groups/${entry.id}`),
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
        groups={groups || []}
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
