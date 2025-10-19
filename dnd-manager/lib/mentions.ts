export type MentionKind = 'character' | 'session' | 'organization' | 'campaign'

export type MentionTarget = {
  id: string
  name: string
  href: string
  kind: MentionKind
}

export type MentionToken =
  | { type: 'text'; value: string }
  | { type: 'mention'; value: string; target: MentionTarget }

export const mentionBoundaryPattern = /[.,!?;:'")\]]/
export const mentionEndPattern = /[\s.,!?;:'")\]]/

export function isMentionBoundary(character: string | undefined): boolean {
  if (!character) {
    return true
  }
  return mentionBoundaryPattern.test(character)
}

export function tokenizeMentions(text: string, targets: MentionTarget[]): MentionToken[] {
  if (!text) {
    return []
  }

  if (!targets.length) {
    return [{ type: 'text', value: text }]
  }

  const prioritizedTargets = targets.map((target, index) => ({ target, index }))
  const sortedTargets = prioritizedTargets.sort((a, b) => {
    if (b.target.name.length !== a.target.name.length) {
      return b.target.name.length - a.target.name.length
    }
    return a.index - b.index
  })

  const tokens: MentionToken[] = []
  let cursor = 0

  const pushText = (value: string) => {
    if (!value) {
      return
    }
    const previous = tokens[tokens.length - 1]
    if (previous && previous.type === 'text') {
      previous.value += value
    } else {
      tokens.push({ type: 'text', value })
    }
  }

  while (cursor < text.length) {
    const atIndex = text.indexOf('@', cursor)

    if (atIndex === -1) {
      pushText(text.slice(cursor))
      break
    }

    if (atIndex > cursor) {
      pushText(text.slice(cursor, atIndex))
    }

    let matchedTarget: MentionTarget | null = null
    let matchedLength = 0

    for (const entry of sortedTargets) {
      const target = entry.target
      const nameLength = target.name.length

      if (nameLength === 0) {
        continue
      }

      const candidate = text.slice(atIndex + 1, atIndex + 1 + nameLength)

      if (candidate.length !== nameLength) {
        continue
      }

      if (candidate.toLowerCase() !== target.name.toLowerCase()) {
        continue
      }

      const lookahead = text.charAt(atIndex + 1 + nameLength)
      if (lookahead && !mentionEndPattern.test(lookahead)) {
        continue
      }

      matchedTarget = target
      matchedLength = nameLength
      break
    }

    if (matchedTarget) {
      const rawValue = text.slice(atIndex, atIndex + 1 + matchedLength)
      tokens.push({ type: 'mention', value: rawValue, target: matchedTarget })
      cursor = atIndex + 1 + matchedLength
    } else {
      pushText('@')
      cursor = atIndex + 1
    }
  }

  return tokens
}

export function collectMentionTargets(text: string, targets: MentionTarget[], kind?: MentionKind): MentionTarget[] {
  if (!text) {
    return []
  }

  const tokens = tokenizeMentions(text, targets)
  const seen = new Set<string>()
  const matches: MentionTarget[] = []

  for (const token of tokens) {
    if (token.type !== 'mention') {
      continue
    }

    if (kind && token.target.kind !== kind) {
      continue
    }

    if (seen.has(token.target.id)) {
      continue
    }

    seen.add(token.target.id)
    matches.push(token.target)
  }

  return matches
}
