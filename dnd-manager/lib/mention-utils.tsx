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
            return 'text-[#2de2e6] decoration-[#2de2e6]/70 hover:text-[#65f8ff] focus-visible:ring-[#2de2e6]/50'
          case 'session':
            return 'text-[#ff6b35] decoration-[#ff6b35]/70 hover:text-[#ff8a5b] focus-visible:ring-[#ff6b35]/50'
          case 'organization':
            return 'text-[var(--semantic)] decoration-[var(--semantic)]/70 hover-brightness focus-visible:ring-[var(--semantic)]/50'
          case 'campaign':
            return 'text-[#00ffff] decoration-[#00ffff]/70 hover:text-[#ff00ff] focus-visible:ring-[#00ffff]/50'
          default:
            return 'text-[#94a3b8] decoration-[#94a3b8]/70 hover:text-[#cbd5f5] focus-visible:ring-[#94a3b8]/50'
        }
      })()

      return (
        <Link
          key={`mention-link-${token.target.id}-${index}`}
          href={token.target.href}
          className={`underline decoration-dotted underline-offset-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 ${colorClasses}`}
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
