import Link from 'next/link'
import type { ReactNode } from 'react'
import { tokenizeMentions, type MentionTarget } from '@/lib/mentions'

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
      return (
        <Link
          key={`mention-link-${token.target.id}-${index}`}
          href={token.target.href}
          className="text-[#ff00ff] underline decoration-dotted underline-offset-4 decoration-[#ff00ff]/70 hover:text-[#ff66ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff]/50"
        >
          {label}
        </Link>
      )
    }

    return <span key={`mention-text-${index}`}>{token.value}</span>
  })
}

