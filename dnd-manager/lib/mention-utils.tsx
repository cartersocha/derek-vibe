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
      const colorClasses = (() => {
        switch (token.target.kind) {
          case 'character':
            return 'text-[#2de2e6] decoration-[#2de2e6]/70 hover:text-[#65f8ff] focus-visible:ring-[#2de2e6]/50'
          case 'session':
            return 'text-[#ff6ad5] decoration-[#ff6ad5]/70 hover:text-[#ff94e3] focus-visible:ring-[#ff6ad5]/50'
          case 'organization':
            return 'text-[#fcee0c] decoration-[#fcee0c]/70 hover:text-[#fff89c] focus-visible:ring-[#fcee0c]/50'
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

