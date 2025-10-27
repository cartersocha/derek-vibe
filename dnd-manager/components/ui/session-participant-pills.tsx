import Link from 'next/link'
import { useMemo } from 'react'
import { cn, type PlayerSummary, getPillClasses } from '@/lib/utils'

const playerWeight = (value: PlayerSummary['player_type']) => (value === 'player' ? 0 : value === 'npc' ? 1 : 2)

type SessionParticipantPillsProps = {
  sessionId: string
  players: PlayerSummary[]
  className?: string
  showOrganizations?: boolean
  organizationMemberCounts?: Map<string, number>
}

export function SessionParticipantPills({ sessionId, players: rawPlayers, className, showOrganizations = true, organizationMemberCounts }: SessionParticipantPillsProps) {
  const sortedPlayers = useMemo(() => {
    if (!rawPlayers?.length) {
      return [] as PlayerSummary[]
    }
    return [...rawPlayers].sort((a, b) => {
      const diff = playerWeight(a.player_type) - playerWeight(b.player_type)
      if (diff !== 0) {
        return diff
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  }, [rawPlayers])

  const uniqueOrganizations = useMemo(() => {
    if (!showOrganizations) {
      return [] as { id: string; name: string }[]
    }
    const seen = new Set<string>()
    const result: { id: string; name: string }[] = []
    for (const player of sortedPlayers) {
      for (const org of player.organizations) {
        if (!seen.has(org.id)) {
          seen.add(org.id)
          result.push(org)
        }
      }
    }
    return result.sort((a, b) => {
      if (organizationMemberCounts) {
        const aCount = organizationMemberCounts.get(a.id) || 0
        const bCount = organizationMemberCounts.get(b.id) || 0
        
        // Sort by member count (descending), then by name (ascending) as tiebreaker
        if (aCount !== bCount) {
          return bCount - aCount
        }
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  }, [sortedPlayers, showOrganizations, organizationMemberCounts])

  if (sortedPlayers.length === 0) {
    return null
  }

  const playerPills = sortedPlayers.map((player) => {
    return (
      <Link
        key={`${sessionId}-${player.id}`}
        href={`/characters/${player.id}`}
        prefetch
        className={getPillClasses(
          player.player_type === 'player' ? 'player' : 'npc',
          'small'
        )}
      >
        {player.name}
      </Link>
    )
  })

  const organizationPills = showOrganizations
    ? uniqueOrganizations.map((organization) => (
        <Link
          key={`${sessionId}-org-${organization.id}`}
          href={`/organizations/${organization.id}`}
          prefetch
          className={getPillClasses('organization', 'small')}
        >
          {organization.name}
        </Link>
      ))
    : []

  return (
    <div className={cn('flex flex-wrap gap-2', className)} aria-label="Players present">
      {playerPills}
      {organizationPills}
    </div>
  )
}
