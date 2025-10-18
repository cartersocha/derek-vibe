import { createClient } from '@/lib/supabase/server'
import { SessionsIndex } from '@/components/ui/sessions-index'
import { extractPlayerSummaries, type SessionCharacterRelation } from '@/lib/utils'

export default async function SessionsPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      campaign:campaigns(name),
      session_characters:session_characters(
        character:characters(id, name, class, race, level)
      )
    `)
    .order('session_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const sessionNumberMap = new Map<string, number>()

  if (sessions) {
    // Group sessions by campaign so we can assign per-campaign sequence numbers
    type SessionWithCampaign = typeof sessions extends (infer S)[] ? S : never
    const sessionsByCampaign = new Map<string, SessionWithCampaign[]>()

    for (const session of sessions) {
      if (!session.campaign_id) {
        continue
      }
      const bucket = sessionsByCampaign.get(session.campaign_id) ?? []
      bucket.push(session)
      sessionsByCampaign.set(session.campaign_id, bucket)
    }

    for (const [, campaignSessions] of sessionsByCampaign) {
      campaignSessions.sort((a, b) => {
        const aDate = a.session_date ? new Date(a.session_date).getTime() : Number.POSITIVE_INFINITY
        const bDate = b.session_date ? new Date(b.session_date).getTime() : Number.POSITIVE_INFINITY
        if (aDate === bDate) {
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
          return aCreated - bCreated
        }
        return aDate - bDate
      })

      let counter = 1
      for (const campaignSession of campaignSessions) {
        if (!campaignSession.session_date) {
          continue
        }
        sessionNumberMap.set(campaignSession.id, counter)
        counter += 1
      }
    }
  }

  const enrichedSessions = (sessions ?? []).map((session) => {
    const rawLinks = Array.isArray(session.session_characters)
      ? (session.session_characters as SessionCharacterRelation[])
      : null
    const players = extractPlayerSummaries(rawLinks)

    return {
      ...session,
      sessionNumber: sessionNumberMap.get(session.id) ?? null,
      players,
    }
  })

  return <SessionsIndex sessions={enrichedSessions} />
}
