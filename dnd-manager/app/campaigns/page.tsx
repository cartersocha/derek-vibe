import { createClient } from '@/lib/supabase/server'
import { CampaignsIndex } from '@/components/ui/campaigns-index'
import { mapEntitiesToMentionTargets, mergeMentionTargets } from '@/lib/mention-utils'

export default async function CampaignsPage() {
  const supabase = await createClient()

  const [campaignsResult, charactersResult, sessionsResult, organizationsResult] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('characters').select('id, name').order('name'),
    supabase.from('sessions').select('id, name').order('name'),
    supabase.from('organizations').select('id, name').order('name'),
  ])

  const campaigns = campaignsResult.data ?? []
  const mentionTargets = mergeMentionTargets(
    mapEntitiesToMentionTargets(charactersResult.data ?? [], 'character', (entry) => `/characters/${entry.id}`),
    mapEntitiesToMentionTargets(sessionsResult.data ?? [], 'session', (entry) => `/sessions/${entry.id}`),
    mapEntitiesToMentionTargets(organizationsResult.data ?? [], 'organization', (entry) => `/organizations/${entry.id}`),
    mapEntitiesToMentionTargets(campaigns, 'campaign', (entry) => `/campaigns/${entry.id}`)
  )
  return <CampaignsIndex campaigns={campaigns} mentionTargets={mentionTargets} />
}
