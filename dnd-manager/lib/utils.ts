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
  id: string;
  name: string;
  class: string | null;
  race: string | null;
  level: string | null;
  player_type: "npc" | "player" | null;
  groups: { id: string; name: string }[]
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
        group_memberships?: Array<{
          groups:
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
        group_memberships?: Array<{
          groups:
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
  const seenPlayerIds = new Set<string>()

  for (const relation of relations) {
    const entry = relation?.character
    const character = Array.isArray(entry) ? entry[0] : entry

    if (!character?.id || !character.name) {
      continue
    }
    if (seenPlayerIds.has(character.id)) {
      continue
    }
    seenPlayerIds.add(character.id)

    const memberships = Array.isArray(character.group_memberships)
      ? character.group_memberships
          .map((membership) => {
            const org = membership?.groups
            const group = Array.isArray(org) ? org[0] : org
            if (!group?.id || !group?.name) {
              return null
            }
            return {
              id: group.id,
              name: group.name,
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
      groups: memberships,
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

export function dateStringToLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) {
    return null
  }

  const segments = dateString.split('-')
  if (segments.length !== 3) {
    return null
  }

  const [yearRaw, monthRaw, dayRaw] = segments
  const year = Number.parseInt(yearRaw, 10)
  const month = Number.parseInt(monthRaw, 10)
  const day = Number.parseInt(dayRaw, 10)

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return null
  }

  return new Date(year, month - 1, day)
}

export function formatDateStringForDisplay(
  dateString: string | null | undefined,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string | null {
  const date = dateStringToLocalDate(dateString)
  if (!date) {
    return null
  }

  return date.toLocaleDateString(locale, options)
}

export function getTodayDateInputValue(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTimestampForDisplay(
  timestamp: string | null | undefined,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string | null {
  if (!timestamp) {
    return null
  }

  const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})/)
  const datePart = match?.[1] ?? null
  const dateOnlyResult = formatDateStringForDisplay(datePart, locale, options)
  if (dateOnlyResult) {
    return dateOnlyResult
  }

  const normalized = timestamp.replace(/\s+/g, 'T')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toLocaleDateString(locale, options)
}

export function coerceDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s]|$)/)
  if (match?.[1]) {
    return match[1]
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Re-export pill styling utilities
export * from './utils/pill-styles'
