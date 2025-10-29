import Link from 'next/link'
import { useMemo } from 'react'
import { cn, type PlayerSummary, getPillClasses } from '@/lib/utils'

const playerWeight = (value: PlayerSummary['player_type']) => (value === 'player' ? 0 : value === 'npc' ? 1 : 2)

type SessionParticipantPillsProps = {
  sessionId: string
  players: PlayerSummary[]
  className?: string
  showGroups?: boolean
  groupMemberCounts?: Map<string, number>
}

export function SessionParticipantPills({ sessionId, players: rawPlayers, className, showGroups = true, groupMemberCounts }: SessionParticipantPillsProps) {
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

  const uniqueGroups = useMemo(() => {
    if (!showGroups) {
      return [] as { id: string; name: string }[]
    }
    const seen = new Set<string>()
    const result: { id: string; name: string }[] = []
    for (const player of sortedPlayers) {
      for (const org of player.groups) {
        if (!seen.has(org.id)) {
          seen.add(org.id)
          result.push(org)
        }
      }
    }
    return result.sort((a, b) => {
      if (groupMemberCounts) {
        const aCount = groupMemberCounts.get(a.id) || 0
        const bCount = groupMemberCounts.get(b.id) || 0
        
        // Sort by member count (descending), then by name (ascending) as tiebreaker
        if (aCount !== bCount) {
          return bCount - aCount
        }
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
  }, [sortedPlayers, showGroups, groupMemberCounts])

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

  const groupPills = showGroups
    ? uniqueGroups.map((group) => (
        <Link
          key={`${sessionId}-org-${group.id}`}
          href={`/groups/${group.id}`}
          prefetch
          className={getPillClasses('group', 'small')}
        >
          {group.name}
        </Link>
      ))
    : []

  return (
    <div className={cn('flex flex-wrap gap-2', className)} aria-label="Players present">
      {playerPills}
      {groupPills}
    </div>
  )
}
