import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type PlayerSummary = {
  id: string
  name: string
  class: string | null
  race: string | null
  level: string | null
  player_type: "npc" | "player" | null
}

export type SessionCharacterRelation = {
  character:
    | null
    | PlayerSummary
    | PlayerSummary[]
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

    players.push({
      id: character.id,
      name: character.name,
      class: character.class ?? null,
      race: character.race ?? null,
      level: character.level ?? null,
      player_type: (character as { player_type?: "npc" | "player" | null })?.player_type ?? null,
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
