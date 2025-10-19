import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return ""
  }

  const normalizeWord = (word: string) =>
    word
      .split(/([-'])/)
      .map((segment) => {
        if (segment === "-" || segment === "'") {
          return segment
        }

        if (!segment) {
          return segment
        }

        const [first, ...rest] = segment
        return `${first.toUpperCase()}${rest.join("").toLowerCase()}`
      })
      .join("")

  return trimmed
    .split(/\s+/)
    .map((word) => normalizeWord(word))
    .join(" ")
}

export type PlayerSummary = {
  id: string
  name: string
  class: string | null
  race: string | null
  level: string | null
  player_type: "npc" | "player" | null
  organizations: { id: string; name: string }[]
}

export type SessionCharacterRelation = {
  character:
    | null
    | ({
        id: string | null
        name: string | null
        class?: string | null
        race?: string | null
        level?: string | null
        player_type?: "npc" | "player" | null
        organization_memberships?: Array<{
          organizations:
            | { id: string | null; name: string | null }
            | Array<{ id: string | null; name: string | null }>
            | null
        }> | null
      })
    | Array<{
        id: string | null
        name: string | null
        class?: string | null
        race?: string | null
        level?: string | null
        player_type?: "npc" | "player" | null
        organization_memberships?: Array<{
          organizations:
            | { id: string | null; name: string | null }
            | Array<{ id: string | null; name: string | null }>
            | null
        }> | null
      }>
}

export function extractPlayerSummaries(
  relations: SessionCharacterRelation[] | null | undefined
): PlayerSummary[] {
  if (!relations || relations.length === 0) {
    return []
  }

  const players: PlayerSummary[] = []

  for (const relation of relations) {
    const entry = relation?.character
    const character = Array.isArray(entry) ? entry[0] : entry

    if (!character?.id || !character.name) {
      continue
    }

    const memberships = Array.isArray(character.organization_memberships)
      ? character.organization_memberships
          .map((membership) => {
            const org = membership?.organizations
            const organization = Array.isArray(org) ? org[0] : org
            if (!organization?.id || !organization?.name) {
              return null
            }
            return {
              id: organization.id,
              name: organization.name,
            }
          })
          .filter((org): org is { id: string; name: string } => Boolean(org))
      : []

    players.push({
      id: character.id,
      name: character.name,
      class: character.class ?? null,
      race: character.race ?? null,
      level: character.level ?? null,
      player_type: (character as { player_type?: "npc" | "player" | null })?.player_type ?? null,
      organizations: memberships,
    })
  }

  return players
}

export function getVisiblePlayers(players: PlayerSummary[], maxVisible = 3) {
  if (players.length <= maxVisible) {
    return {
      visible: players,
      hiddenCount: 0,
    }
  }

  return {
    visible: players.slice(0, maxVisible),
    hiddenCount: players.length - maxVisible,
  }
}
