import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  extractPlayerSummaries,
  dateStringToLocalDate,
  formatDateStringForDisplay,
  type SessionCharacterRelation,
} from '@/lib/utils'
import { DashboardSessionCard } from '@/components/ui/dashboard-session-card'
import DashboardContent from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch statistics
  const [
    { count: campaignsCount },
    { count: sessionsCount },
    { count: charactersCount },
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('characters').select('*', { count: 'exact', head: true }),
  ])

  // Fetch recent sessions
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select(`
      id,
      name,
      session_date,
      created_at,
      campaign_id,
      notes,
      campaign:campaigns(id, name),
      session_characters:session_characters(
        character:characters(
          id,
          name,
          class,
          race,
          level,
          player_type,
          organization_memberships:organization_characters(
            organizations(id, name)
          )
        )
      ),
      session_organizations:organization_sessions(
        organization:organizations(id, name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(3)

  const sessionNumberMap = new Map<string, number>()

  if (recentSessions && recentSessions.length > 0) {
    const campaignIds = Array.from(
      new Set(
        recentSessions
          .map((session) => session.campaign_id)
          .filter((campaignId): campaignId is string => Boolean(campaignId))
      )
    )

    if (campaignIds.length > 0) {
      const { data: relatedSessions } = await supabase
        .from('sessions')
        .select('id, campaign_id, session_date, created_at')
        .in('campaign_id', campaignIds)

      if (relatedSessions) {
        const groupedByCampaign = relatedSessions.reduce<Map<string, typeof relatedSessions>>((acc, session) => {
          if (!session.campaign_id) {
            return acc
          }
          const existing = acc.get(session.campaign_id)
          if (existing) {
            existing.push(session)
          } else {
            acc.set(session.campaign_id, [session])
          }
          return acc
        }, new Map())

        groupedByCampaign.forEach((sessions) => {
          const sorted = sessions
            .filter((session) => Boolean(session.session_date))
            .sort((a, b) => {
              if (a.session_date && b.session_date) {
                const aDate = dateStringToLocalDate(a.session_date)
                const bDate = dateStringToLocalDate(b.session_date)
                if (aDate && bDate) {
                  const dateCompare = aDate.getTime() - bDate.getTime()
                  if (dateCompare !== 0) {
                    return dateCompare
                  }
                }
              }

              const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
              const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
              return aCreated - bCreated
            })

          let counter = 1
          for (const session of sorted) {
            sessionNumberMap.set(session.id, counter)
            counter += 1
          }
        })
      }
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="retro-title glitch-subtle text-2xl sm:text-3xl font-bold text-[#00ffff] break-words" data-text="DASHBOARD">Dashboard</h1>
      </div>

      <DashboardContent 
        recentSessions={recentSessions || []}
        campaignsCount={campaignsCount || 0}
        sessionsCount={sessionsCount || 0}
        charactersCount={charactersCount || 0}
      />
    </div>
  )
}
