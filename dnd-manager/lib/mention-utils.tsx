import Link from 'next/link'
import type { ReactNode } from 'react'

export type MentionTarget = {
  id: string
  name: string
}

const mentionBoundaryPattern = /[\s.,!?;:'")\]]/

export function renderNotesWithMentions(notes: string, characters: MentionTarget[]): ReactNode {
  if (!notes) {
    return null
  }

  if (!characters.length) {
    return notes
  }

  const sortedCharacters = [...characters].sort((a, b) => b.name.length - a.name.length)
  const fragments: ReactNode[] = []
  let cursor = 0
  let keyCounter = 0

  const appendPlainText = (text: string) => {
    if (!text) {
      return
    }
    fragments.push(<span key={`mention-text-${keyCounter++}`}>{text}</span>)
  }

  while (cursor < notes.length) {
    const atIndex = notes.indexOf('@', cursor)

    if (atIndex === -1) {
      appendPlainText(notes.slice(cursor))
      break
    }

    if (atIndex > cursor) {
      appendPlainText(notes.slice(cursor, atIndex))
    }

    let matchedCharacter: MentionTarget | null = null
    let matchedLength = 0

    for (const character of sortedCharacters) {
      const nameLength = character.name.length
      const candidate = notes.slice(atIndex + 1, atIndex + 1 + nameLength)

      if (candidate.length !== nameLength) {
        continue
      }

      if (candidate.toLowerCase() !== character.name.toLowerCase()) {
        continue
      }

      const lookahead = notes.charAt(atIndex + 1 + nameLength)
      if (lookahead && !mentionBoundaryPattern.test(lookahead)) {
        continue
      }

      matchedCharacter = character
      matchedLength = nameLength
      break
    }

    if (matchedCharacter) {
      fragments.push(
        <Link
          key={`mention-link-${matchedCharacter.id}-${keyCounter++}`}
          href={`/characters/${matchedCharacter.id}`}
          className="text-[#ff00ff] underline decoration-dotted underline-offset-4 decoration-[#ff00ff]/70 hover:text-[#ff66ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff00ff]/50"
        >
          @{matchedCharacter.name}
        </Link>
      )
      cursor = atIndex + 1 + matchedLength
    } else {
      fragments.push(<span key={`mention-literal-${keyCounter++}`}>@</span>)
      cursor = atIndex + 1
    }
  }

  return fragments
}

export function isMentionBoundary(character: string | undefined): boolean {
  if (!character) {
    return true
  }
  return mentionBoundaryPattern.test(character)
}
