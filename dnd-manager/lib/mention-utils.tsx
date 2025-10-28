import Link from 'next/link'
import type { ReactNode } from 'react'
import { tokenizeMentions, type MentionTarget, type MentionKind } from '@/lib/mentions'

export type { MentionTarget } from '@/lib/mentions'
export { collectMentionTargets, isMentionBoundary } from '@/lib/mentions'

export function renderNotesWithMentions(text: string, targets: MentionTarget[]): ReactNode {
  if (!text) {
    return null
  }

  if (!targets.length) {
    return text
  }

  const tokens = tokenizeMentions(text, targets)

  if (tokens.length === 1 && tokens[0]?.type === 'text') {
    return tokens[0].value
  }

  return tokens.map((token, index) => {
    if (token.type === 'mention') {
      const label = `@${token.target.name}`
      const colorClasses = (() => {
        switch (token.target.kind) {
          case 'character':
            return 'text-[var(--cyber-cyan)] hover:text-[var(--cyber-cyan)] hover:bg-[var(--cyber-cyan)]/10 focus-visible:ring-[var(--cyber-cyan)]/50'
          case 'session':
            return 'text-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)] hover:bg-[var(--cyber-magenta)]/10 focus-visible:ring-[var(--cyber-magenta)]/50'
          case 'organization':
            return 'text-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)] hover:bg-[var(--cyber-magenta)]/10 focus-visible:ring-[var(--cyber-magenta)]/50'
          case 'campaign':
            return 'text-[var(--orange-400)] hover:text-[var(--orange-500)] hover:bg-[var(--orange-400)]/10 focus-visible:ring-[var(--orange-400)]/50'
          default:
            return 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:ring-[var(--text-secondary)]/50'
        }
      })()

      return (
        <Link
          key={`mention-link-${token.target.id}-${index}`}
          href={token.target.href}
          className={`inline-flex items-center rounded px-1 -mx-0.5 transition-all duration-150 hover-glow focus-visible:outline-none focus-visible:ring-2 ${colorClasses}`}
        >
          {label}
        </Link>
      )
    }

    return <span key={`mention-text-${index}`}>{token.value}</span>
  })
}

type EntityWithName = {
  id?: string | null
  name?: string | null
}

export function mapEntitiesToMentionTargets<T extends EntityWithName>(
  entries: readonly T[] | null | undefined,
  kind: MentionKind,
  hrefBuilder: (entry: T) => string
): MentionTarget[] {
  if (!entries?.length) {
    return []
  }

  const results: MentionTarget[] = []

  for (const entry of entries) {
    if (!entry) {
      continue
    }

    const { id, name } = entry
    if (typeof id !== 'string' || !id || typeof name !== 'string' || !name) {
      continue
    }

    results.push({
      id,
      name,
      kind,
      href: hrefBuilder(entry),
    })
  }

  return results
}

export function mergeMentionTargets(...lists: Array<readonly MentionTarget[]>): MentionTarget[] {
  const map = new Map<string, MentionTarget>()

  for (const list of lists) {
    if (!list?.length) {
      continue
    }

    for (const target of list) {
      if (!target?.id || !target?.name) {
        continue
      }
      const key = `${target.kind}:${target.id}`
      if (!map.has(key)) {
        map.set(key, target)
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}
