"use client"

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react"
import { createPortal } from "react-dom"
import AutoResizeTextarea, { type AutoResizeTextareaProps } from "@/components/ui/auto-resize-textarea"
import { createCharacterInline } from "@/lib/actions/characters"
import { createOrganizationInline } from "@/lib/actions/organizations"
import { createSessionInline } from "@/lib/actions/sessions"
import { createCampaignInline } from "@/lib/actions/campaigns"
import { cn } from "@/lib/utils"
import { isMentionBoundary, type MentionTarget } from "@/lib/mention-utils"
import { mentionEndPattern } from "@/lib/mentions"

type MentionableTextareaProps = Omit<AutoResizeTextareaProps, "defaultValue" | "value" | "onChange" | "onKeyDown" | "onSelect" | "onBlur"> & {
  initialValue?: string | null
  mentionTargets: MentionTarget[]
  onValueChange?: (value: string) => void
  onMentionInsert?: (target: MentionTarget) => void
}

type MentionOption = MentionTarget

type MentionKindLabelProps = {
  kind: MentionOption["kind"]
}

function MentionKindLabel({ kind }: MentionKindLabelProps) {
  const label = (() => {
    switch (kind) {
      case "character":
        return "Character"
      case "session":
        return "Session"
      case "organization":
        return "Organization"
      case "campaign":
        return "Campaign"
      default:
        return "Mention"
    }
  })()

  const colorClasses = (() => {
    switch (kind) {
      case "character":
        return "border-[#2de2e6] text-[#2de2e6]"
      case "session":
        return "border-[#ff6ad5] text-[#ff6ad5]"
      case "organization":
        return "border-[#fcee0c] text-[#fcee0c]"
      case "campaign":
        return "border-[#ff6b35] text-[#ff6b35]"
      default:
        return "border-[#94a3b8] text-[#94a3b8]"
    }
  })()

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[#11112b]",
        colorClasses
      )}
    >
      {label}
    </span>
  )
}

export default function MentionableTextarea({
  initialValue,
  mentionTargets,
  onValueChange,
  onMentionInsert,
  className,
  ...rest
}: MentionableTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [value, setValue] = useState(() => initialValue ?? "")
  const [isMentionMenuOpen, setIsMentionMenuOpen] = useState(false)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionHighlightIndex, setMentionHighlightIndex] = useState(0)
  const [mentionDropdownPosition, setMentionDropdownPosition] = useState<{
    viewportTop: number
    viewportLeft: number
    width: number
    maxHeight: number
    placement: "above" | "below"
  } | null>(null)
  const [availableTargets, setAvailableTargets] = useState<MentionTarget[]>(mentionTargets)
  const [isCreatingMentionCharacter, setIsCreatingMentionCharacter] = useState(false)
  const [mentionCreationError, setMentionCreationError] = useState<string | null>(null)
  const mentionListId = useId()

  const trimmedMentionQuery = mentionQuery.trim()
  const normalizedMentionQuery = trimmedMentionQuery.toLowerCase()

  useEffect(() => {
    setValue(initialValue ?? "")
  }, [initialValue])

  useEffect(() => {
    setAvailableTargets((previous) => {
      const merged = new Map<string, MentionTarget>()
      mentionTargets.forEach((target) => {
        merged.set(target.id, target)
      })
      previous.forEach((target) => {
        if (!merged.has(target.id)) {
          merged.set(target.id, target)
        }
      })
      return Array.from(merged.values())
    })
  }, [mentionTargets])

  const sortedTargets = useMemo(
    () => [...availableTargets].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [availableTargets]
  )

  const mentionOptions = useMemo(() => {
    const MAX_OPTIONS = 12
    const priorityOrder: Array<MentionOption["kind"]> = ["character", "organization", "session"]

    const entries = normalizedMentionQuery
      ? sortedTargets.filter((target) => target.name.toLowerCase().includes(normalizedMentionQuery))
      : sortedTargets

    if (entries.length <= MAX_OPTIONS) {
      return entries
    }

    const bucketMap = new Map<MentionOption["kind"], MentionOption[]>(
      priorityOrder.map((kind) => [kind, entries.filter((target) => target.kind === kind)])
    )

    const fallbackBucket = entries.filter((target) => !priorityOrder.includes(target.kind))

    const cursors = new Map<string, number>()
    const orderedBuckets: Array<{ key: string; items: MentionOption[] }> = [
      ...priorityOrder.map((kind) => ({ key: kind, items: bucketMap.get(kind) ?? [] })),
      { key: "__fallback__", items: fallbackBucket },
    ]

    const results: MentionOption[] = []

    while (results.length < MAX_OPTIONS) {
      let addedThisRound = false

      for (const bucket of orderedBuckets) {
        if (results.length >= MAX_OPTIONS) {
          break
        }

        const cursor = cursors.get(bucket.key) ?? 0
        if (cursor >= bucket.items.length) {
          continue
        }

        results.push(bucket.items[cursor])
        cursors.set(bucket.key, cursor + 1)
        addedThisRound = true
      }

      if (!addedThisRound) {
        break
      }
    }

    return results.length > 0 ? results : entries.slice(0, MAX_OPTIONS)
  }, [normalizedMentionQuery, sortedTargets])

  const characterTargets = useMemo(
    () => sortedTargets.filter((target) => target.kind === "character"),
    [sortedTargets]
  )

  const organizationTargets = useMemo(
    () => sortedTargets.filter((target) => target.kind === "organization"),
    [sortedTargets]
  )

  const sessionTargets = useMemo(
    () => sortedTargets.filter((target) => target.kind === "session"),
    [sortedTargets]
  )

  const campaignTargets = useMemo(
    () => sortedTargets.filter((target) => target.kind === "campaign"),
    [sortedTargets]
  )

  const hasExactCharacterMatch = useMemo(
    () => characterTargets.some((target) => target.name.toLowerCase() === normalizedMentionQuery),
    [characterTargets, normalizedMentionQuery]
  )

  const hasExactOrganizationMatch = useMemo(
    () => organizationTargets.some((target) => target.name.toLowerCase() === normalizedMentionQuery),
    [organizationTargets, normalizedMentionQuery]
  )

  const hasExactSessionMatch = useMemo(
    () => sessionTargets.some((target) => target.name.toLowerCase() === normalizedMentionQuery),
    [sessionTargets, normalizedMentionQuery]
  )

  const hasExactCampaignMatch = useMemo(
    () => campaignTargets.some((target) => target.name.toLowerCase() === normalizedMentionQuery),
    [campaignTargets, normalizedMentionQuery]
  )

  const showCreateCharacterOption = trimmedMentionQuery.length > 0 && !hasExactCharacterMatch
  const showCreateOrganizationOption = trimmedMentionQuery.length > 0 && !hasExactOrganizationMatch
  const showCreateSessionOption = trimmedMentionQuery.length > 0 && !hasExactSessionMatch
  const showCreateCampaignOption = trimmedMentionQuery.length > 0 && !hasExactCampaignMatch

  const createOptionsCount = (showCreateCharacterOption ? 1 : 0) + (showCreateOrganizationOption ? 1 : 0) + (showCreateSessionOption ? 1 : 0) + (showCreateCampaignOption ? 1 : 0)

  const totalMentionChoices = useMemo(
    () => mentionOptions.length + createOptionsCount,
    [mentionOptions, createOptionsCount]
  )

  const closeMentionMenu = useCallback(() => {
    setIsMentionMenuOpen(false)
    setMentionStart(null)
    setMentionQuery("")
    setMentionHighlightIndex(0)
    setMentionDropdownPosition(null)
    setMentionCreationError(null)
  }, [])

  const measureCaretPosition = useCallback((textarea: HTMLTextAreaElement, index: number) => {
    if (typeof window === "undefined") {
      return null
    }

    const doc = textarea.ownerDocument
    const textBefore = textarea.value.slice(0, index).replace(/\n$/u, "\n\u200b")
    const marker = doc.createElement("span")
    marker.textContent = "\u200b"

    const mirror = doc.createElement("div")
    const computed = window.getComputedStyle(textarea)

    mirror.style.position = "absolute"
    mirror.style.visibility = "hidden"
    mirror.style.whiteSpace = "pre-wrap"
    mirror.style.wordBreak = "break-word"
    mirror.style.overflow = "hidden"
    mirror.style.padding = computed.padding
    mirror.style.border = computed.border
    mirror.style.boxSizing = computed.boxSizing
    mirror.style.font = computed.font
    mirror.style.letterSpacing = computed.letterSpacing
    mirror.style.textTransform = computed.textTransform
    mirror.style.textAlign = computed.textAlign
    mirror.style.lineHeight = computed.lineHeight
    mirror.style.width = `${textarea.clientWidth}px`
    mirror.textContent = textBefore
    mirror.appendChild(marker)

    doc.body.appendChild(mirror)

    const markerRect = marker.getBoundingClientRect()
    const mirrorRect = mirror.getBoundingClientRect()
    const relativeTop = markerRect.top - mirrorRect.top
    const relativeLeft = markerRect.left - mirrorRect.left

    mirror.remove()

    const rawLineHeight = computed.lineHeight
    let lineHeight = parseFloat(rawLineHeight)
    if (Number.isNaN(lineHeight)) {
      const fontSize = parseFloat(computed.fontSize)
      lineHeight = Number.isNaN(fontSize) ? 16 : fontSize * 1.2
    }

    return {
      top: relativeTop,
      left: relativeLeft,
      lineHeight,
    }
  }, [])

  const updateMentionMenuPosition = useCallback(
    (textarea: HTMLTextAreaElement | null, anchorIndex: number, labels: string[]) => {
      if (!textarea) {
        setMentionDropdownPosition((prev) => (prev === null ? prev : null))
        return
      }

      const metrics = measureCaretPosition(textarea, Math.max(0, anchorIndex))
      if (!metrics) {
        setMentionDropdownPosition((prev) => (prev === null ? prev : null))
        return
      }

      const computed = window.getComputedStyle(textarea)
      const fontSize = parseFloat(computed.fontSize) || 16
      const approxCharWidth = fontSize * 0.6
      const longestLabelLength = labels.length > 0 ? labels.reduce((max, label) => Math.max(max, label.length), 0) : 12
      const desiredWidth = Math.ceil(longestLabelLength * approxCharWidth + fontSize * 2)
      const minWidthBase = Math.max(fontSize * 8, 240)
      const fallbackWidth = textarea.clientWidth || desiredWidth

      const textareaRect = textarea.getBoundingClientRect()
      const viewportWidth = (typeof window !== "undefined" ? window.innerWidth : undefined) ?? textareaRect.width
      const viewportHeight = (typeof window !== "undefined" ? window.innerHeight : undefined) ?? textareaRect.height

      let dropdownWidth = Math.max(desiredWidth, Math.min(minWidthBase, fallbackWidth))
      dropdownWidth = Math.min(dropdownWidth, fallbackWidth)
      dropdownWidth = Math.max(dropdownWidth, 160)
      if (dropdownWidth > viewportWidth - 16) {
        dropdownWidth = Math.max(viewportWidth - 16, 160)
      }

      const scrollTop = textarea.scrollTop || 0
      const scrollLeft = textarea.scrollLeft || 0
      const availableLeft = Math.max((textarea.clientWidth || dropdownWidth) - dropdownWidth, 0)
      const leftWithinTextarea = Math.min(Math.max(metrics.left - scrollLeft, 0), availableLeft)

      const viewportLeft = textareaRect.left + leftWithinTextarea
      const maxViewportLeft = Math.max(viewportWidth - dropdownWidth - 8, 8)
      const safeViewportLeft = Math.min(Math.max(viewportLeft, 8), maxViewportLeft)

      const caretTopViewport = textareaRect.top + metrics.top - scrollTop
      const caretBottomViewport = caretTopViewport + metrics.lineHeight

      const baseGap = Math.max(metrics.lineHeight * 0.35, 16)
      const anchorBelow = caretBottomViewport + baseGap
      const anchorAbove = caretTopViewport - baseGap

      const availableBelow = viewportHeight - anchorBelow - 12
      const availableAbove = anchorAbove - 12

      const MIN_MENU_HEIGHT = 140
      const MAX_MENU_HEIGHT = 360

      const clampHeight = (value: number) => {
        const clipped = Math.min(value, MAX_MENU_HEIGHT)
        const bounded = Math.max(clipped, 120)
        return Number.isFinite(bounded) ? bounded : 160
      }

      let placement: "above" | "below" = "below"
      if (availableBelow < MIN_MENU_HEIGHT && availableAbove > availableBelow) {
        placement = "above"
      }

      let viewportTop: number
      let maxHeight: number

      if (placement === "below") {
        viewportTop = Math.min(anchorBelow, viewportHeight - 8)
        maxHeight = clampHeight(availableBelow)
      } else {
        viewportTop = Math.max(anchorAbove, 8)
        maxHeight = clampHeight(availableAbove)
      }

      setMentionDropdownPosition((prev) => {
        if (
          prev &&
          prev.viewportTop === viewportTop &&
          prev.viewportLeft === safeViewportLeft &&
          prev.width === dropdownWidth &&
          prev.maxHeight === maxHeight &&
          prev.placement === placement
        ) {
          return prev
        }
        return {
          viewportTop,
          viewportLeft: safeViewportLeft,
          width: dropdownWidth,
          maxHeight,
          placement,
        }
      })
    },
    [measureCaretPosition]
  )

  const updateMentionState = useCallback(
    (draft: string, caretIndex: number, textarea?: HTMLTextAreaElement | null) => {
      const safeCaret = Number.isFinite(caretIndex) ? Math.max(0, Math.min(caretIndex, draft.length)) : draft.length
      const preceding = draft.slice(0, safeCaret)
      const atIndex = preceding.lastIndexOf("@")

      if (atIndex === -1) {
        closeMentionMenu()
        return
      }

      if (atIndex > 0 && !isMentionBoundary(preceding.charAt(atIndex - 1))) {
        closeMentionMenu()
        return
      }

      const query = preceding.slice(atIndex + 1)

      // Allow spaces in mention queries for multi-word names
      // Only close menu on newlines or tabs
      if (/[\n\r\t]/.test(query)) {
        closeMentionMenu()
        return
      }

      setIsMentionMenuOpen(true)
      setMentionStart(atIndex)
      setMentionQuery(query)
      setMentionHighlightIndex(0)
      updateMentionMenuPosition(textarea ?? null, atIndex, [])
    },
    [closeMentionMenu, updateMentionMenuPosition]
  )

  const handleValueChange = useCallback(
    (next: string, caretIndex: number, textarea?: HTMLTextAreaElement | null) => {
      setValue(next)
      onValueChange?.(next)
      updateMentionState(next, caretIndex, textarea ?? textareaRef.current)
    },
    [onValueChange, updateMentionState]
  )

  const handleTextareaChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = event.target.value
      const caret = event.target.selectionStart ?? nextValue.length
      handleValueChange(nextValue, caret, event.target)
    },
    [handleValueChange]
  )

  const insertMention = useCallback(
    (target: MentionOption) => {
      const textarea = textareaRef.current
      const rawValue = textarea ? textarea.value : value
      const startIndex = mentionStart ?? textarea?.selectionStart ?? 0
      const selectionEnd = textarea?.selectionEnd ?? startIndex
      const safeStart = Math.max(0, Math.min(startIndex, rawValue.length))
      const safeEnd = Math.max(safeStart, Math.min(selectionEnd, rawValue.length))
      const before = rawValue.slice(0, safeStart)
      const after = rawValue.slice(safeEnd)
      const mentionText = `@${target.name}`
      const needsSpace = after.length === 0 ? true : !mentionEndPattern.test(after.charAt(0))
      const insertion = needsSpace ? `${mentionText} ` : mentionText
      const nextValue = `${before}${insertion}${after}`

      setValue(nextValue)
      onValueChange?.(nextValue)
      onMentionInsert?.(target)
      closeMentionMenu()

      requestAnimationFrame(() => {
        const node = textareaRef.current
        if (!node) {
          return
        }
        const cursor = safeStart + insertion.length
        node.focus()
        node.setSelectionRange(cursor, cursor)
        updateMentionState(nextValue, cursor, node)
      })
    },
    [closeMentionMenu, mentionStart, onMentionInsert, onValueChange, updateMentionState, value]
  )

  const handleTextareaSelect = useCallback(
    (event: SyntheticEvent<HTMLTextAreaElement>) => {
      const caret = event.currentTarget.selectionStart ?? event.currentTarget.value.length
      updateMentionState(event.currentTarget.value, caret, event.currentTarget)
    },
    [updateMentionState]
  )

  const handleCreateCharacter = useCallback(async () => {
    if (isCreatingMentionCharacter) {
      return
    }

    if (!trimmedMentionQuery || hasExactCharacterMatch) {
      return
    }

    setIsCreatingMentionCharacter(true)
    setMentionCreationError(null)

    try {
      const result = await createCharacterInline(trimmedMentionQuery)
      const newTarget: MentionOption = {
        id: result.id,
        name: result.name,
        href: `/characters/${result.id}`,
        kind: "character",
      }

      setAvailableTargets((previous) => {
        const exists = previous.some((entry) => entry.id === newTarget.id)
        if (exists) {
          return previous
        }
        return [...previous, newTarget]
      })

      insertMention(newTarget)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create character"
      setMentionCreationError(message)
    } finally {
      setIsCreatingMentionCharacter(false)
    }
  }, [hasExactCharacterMatch, insertMention, isCreatingMentionCharacter, trimmedMentionQuery])

  const handleCreateOrganization = useCallback(async () => {
    if (isCreatingMentionCharacter) {
      return
    }

    if (!trimmedMentionQuery || hasExactOrganizationMatch) {
      return
    }

    setIsCreatingMentionCharacter(true)
    setMentionCreationError(null)

    try {
      const result = await createOrganizationInline(trimmedMentionQuery)
      const newTarget: MentionOption = {
        id: result.id,
        name: result.name,
        href: `/organizations/${result.id}`,
        kind: "organization",
      }

      setAvailableTargets((previous) => {
        const exists = previous.some((entry) => entry.id === newTarget.id)
        if (exists) {
          return previous
        }
        return [...previous, newTarget]
      })

      insertMention(newTarget)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create organization"
      setMentionCreationError(message)
    } finally {
      setIsCreatingMentionCharacter(false)
    }
  }, [hasExactOrganizationMatch, insertMention, isCreatingMentionCharacter, trimmedMentionQuery])

  const handleCreateSession = useCallback(async () => {
    if (isCreatingMentionCharacter) {
      return
    }

    if (!trimmedMentionQuery || hasExactSessionMatch) {
      return
    }

    setIsCreatingMentionCharacter(true)
    setMentionCreationError(null)

    try {
      const result = await createSessionInline(trimmedMentionQuery)
      const newTarget: MentionOption = {
        id: result.id,
        name: result.name,
        href: `/sessions/${result.id}`,
        kind: "session",
      }

      setAvailableTargets((previous) => {
        const exists = previous.some((entry) => entry.id === newTarget.id)
        if (exists) {
          return previous
        }
        return [...previous, newTarget]
      })

      insertMention(newTarget)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create session"
      setMentionCreationError(message)
    } finally {
      setIsCreatingMentionCharacter(false)
    }
  }, [hasExactSessionMatch, insertMention, isCreatingMentionCharacter, trimmedMentionQuery])

  const handleCreateCampaign = useCallback(async () => {
    if (isCreatingMentionCharacter) {
      return
    }

    if (!trimmedMentionQuery || hasExactCampaignMatch) {
      return
    }

    setIsCreatingMentionCharacter(true)
    setMentionCreationError(null)

    try {
      const result = await createCampaignInline(trimmedMentionQuery)
      const newTarget: MentionOption = {
        id: result.id,
        name: result.name,
        href: `/campaigns/${result.id}`,
        kind: "campaign",
      }

      setAvailableTargets((previous) => {
        const exists = previous.some((entry) => entry.id === newTarget.id)
        if (exists) {
          return previous
        }
        return [...previous, newTarget]
      })

      insertMention(newTarget)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create campaign"
      setMentionCreationError(message)
    } finally {
      setIsCreatingMentionCharacter(false)
    }
  }, [hasExactCampaignMatch, insertMention, isCreatingMentionCharacter, trimmedMentionQuery])


  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isMentionMenuOpen) {
        return
      }

      if (totalMentionChoices === 0) {
        if (event.key === "Escape") {
          event.preventDefault()
          closeMentionMenu()
        }
        return
      }

      if (event.key === "ArrowDown") {
        event.preventDefault()
        setMentionHighlightIndex((prev) => (prev + 1) % totalMentionChoices)
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        setMentionHighlightIndex((prev) => (prev - 1 + totalMentionChoices) % totalMentionChoices)
        return
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        if (mentionHighlightIndex < mentionOptions.length) {
          const option = mentionOptions[mentionHighlightIndex]
          if (option) {
            insertMention(option)
          }
        } else {
          // Handle create options
          const createIndex = mentionHighlightIndex - mentionOptions.length
          
          // Determine which create option is at this index
          let currentIndex = 0
          if (showCreateCharacterOption) {
            if (createIndex === currentIndex) {
              void handleCreateCharacter()
              return
            }
            currentIndex++
          }
          if (showCreateOrganizationOption) {
            if (createIndex === currentIndex) {
              void handleCreateOrganization()
              return
            }
            currentIndex++
          }
          if (showCreateSessionOption) {
            if (createIndex === currentIndex) {
              void handleCreateSession()
              return
            }
            currentIndex++
          }
          if (showCreateCampaignOption) {
            if (createIndex === currentIndex) {
              void handleCreateCampaign()
              return
            }
          }
        }
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        closeMentionMenu()
      }
    },
    [closeMentionMenu, handleCreateCharacter, handleCreateOrganization, handleCreateSession, handleCreateCampaign, insertMention, isMentionMenuOpen, mentionHighlightIndex, mentionOptions, showCreateCharacterOption, showCreateOrganizationOption, showCreateSessionOption, showCreateCampaignOption, totalMentionChoices]
  )

  const handleMentionClick = useCallback(
    (option: MentionOption) => {
      insertMention(option)
    },
    [insertMention]
  )

  const handleMentionHover = useCallback((index: number) => {
    setMentionHighlightIndex(index)
  }, [])

  useEffect(() => {
    if (!isMentionMenuOpen) {
      return
    }
    setMentionHighlightIndex((prev) => {
      if (totalMentionChoices === 0) {
        return 0
      }
      return Math.min(prev, totalMentionChoices - 1)
    })
  }, [isMentionMenuOpen, totalMentionChoices])

  const mentionMenuLabels = useMemo(() => {
    const labels = mentionOptions.map((option) => option.name)
    if (showCreateCharacterOption) {
      labels.push(`Create "${trimmedMentionQuery}" (Character)`)
    }
    if (showCreateOrganizationOption) {
      labels.push(`Create "${trimmedMentionQuery}" (Organization)`)
    }
    if (showCreateSessionOption) {
      labels.push(`Create "${trimmedMentionQuery}" (Session)`)
    }
    if (showCreateCampaignOption) {
      labels.push(`Create "${trimmedMentionQuery}" (Campaign)`)
    }
    return labels
  }, [mentionOptions, showCreateCharacterOption, showCreateOrganizationOption, showCreateSessionOption, showCreateCampaignOption, trimmedMentionQuery])

  useEffect(() => {
    if (!isMentionMenuOpen) {
      return
    }

    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    const anchorIndex = mentionStart ?? (typeof textarea.selectionStart === "number" ? textarea.selectionStart : 0)
    const reposition = () => {
      updateMentionMenuPosition(textarea, anchorIndex, mentionMenuLabels)
    }

    reposition()

    textarea.addEventListener('scroll', reposition, { passive: true })

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', reposition, { passive: true })
      window.addEventListener('resize', reposition)
    }

    return () => {
      textarea.removeEventListener('scroll', reposition)
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', reposition)
        window.removeEventListener('resize', reposition)
      }
    }
  }, [isMentionMenuOpen, mentionMenuLabels, mentionStart, updateMentionMenuPosition])

  const mentionDropdownStyle = useMemo<CSSProperties>(() => {
    if (!mentionDropdownPosition) {
      return {
        top: "calc(100% + 0.5rem)",
        left: 0,
        minWidth: "16rem",
        width: "min(24rem, 100%)",
        maxWidth: "100%",
      }
    }

    return {
      top: mentionDropdownPosition.viewportTop,
      left: mentionDropdownPosition.viewportLeft,
      width: mentionDropdownPosition.width,
      minWidth: mentionDropdownPosition.width,
      maxWidth: mentionDropdownPosition.width,
      transform: mentionDropdownPosition.placement === "above" ? "translateY(-100%)" : undefined,
      transformOrigin: mentionDropdownPosition.placement === "above" ? "bottom left" : undefined,
    }
  }, [mentionDropdownPosition])

  return (
    <div className="relative">
      <AutoResizeTextarea
        {...rest}
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleTextareaKeyDown}
        onSelect={handleTextareaSelect}
        aria-autocomplete="list"
        aria-expanded={isMentionMenuOpen}
        aria-controls={isMentionMenuOpen ? mentionListId : undefined}
        className={cn("pr-3", className)}
        maxHeight={400}
      />

      {isMentionMenuOpen && mentionDropdownPosition && typeof window !== "undefined" &&
        createPortal(
          <div
            id={mentionListId}
            className="fixed overflow-y-auto rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-2xl shadow-[#00ffff]/20"
            role="listbox"
            style={{
              ...mentionDropdownStyle,
              maxHeight: `${mentionDropdownPosition.maxHeight}px`,
              zIndex: 2147483647,
            }}
          >
          {mentionOptions.length === 0 && !showCreateCharacterOption && !showCreateOrganizationOption && !showCreateSessionOption && !showCreateCampaignOption ? (
            <p className="px-3 py-2 text-xs font-mono uppercase tracking-widest text-gray-500">
              No matches
            </p>
          ) : (
            <>
              {mentionOptions.map((option, index) => {
                const isActive = index === mentionHighlightIndex
                const { baseTextColor, activeTextColor } = (() => {
                  switch (option.kind) {
                    case "character":
                      return {
                        baseTextColor: "text-[#2de2e6]",
                        activeTextColor: "text-[#65f8ff]",
                      }
                    case "session":
                      return {
                        baseTextColor: "text-[#ff6ad5]",
                        activeTextColor: "text-[#ff94e3]",
                      }
                    case "organization":
                      return {
                        baseTextColor: "text-[#fcee0c]",
                        activeTextColor: "text-[#fff89c]",
                      }
                    case "campaign":
                      return {
                        baseTextColor: "text-[#ff6b35]",
                        activeTextColor: "text-[#ff8a5b]",
                      }
                    default:
                      return {
                        baseTextColor: "text-[#94a3b8]",
                        activeTextColor: "text-white",
                      }
                  }
                })()
                return (
                  <button
                    key={`${option.kind}-${option.id}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleMentionClick(option)}
                    onMouseEnter={() => handleMentionHover(index)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-mono text-sm transition-colors ${
                      isActive ? `bg-[#1a1a3e] ${activeTextColor}` : `${baseTextColor} hover:bg-[#11112b]`
                    }`}
                  >
                    <span className="font-semibold">{option.name}</span>
                    <MentionKindLabel kind={option.kind} />
                  </button>
                )
              })}
              {showCreateCharacterOption ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={mentionHighlightIndex === mentionOptions.length}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void handleCreateCharacter()}
                  onMouseEnter={() => handleMentionHover(mentionOptions.length)}
                  disabled={isCreatingMentionCharacter}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-mono text-sm transition-colors ${
                    mentionHighlightIndex === mentionOptions.length
                      ? "bg-[#1a1a3e] text-[#65f8ff]"
                      : "text-[#2de2e6] hover:bg-[#11112b]"
                  } ${isCreatingMentionCharacter ? "opacity-60" : ""}`}
                >
                  <span className="font-semibold">
                    {isCreatingMentionCharacter ? "Creating…" : `Create "${trimmedMentionQuery}"`}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#2de2e6]">
                    New Character
                  </span>
                </button>
              ) : null}
              {showCreateOrganizationOption ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={mentionHighlightIndex === (mentionOptions.length + (showCreateCharacterOption ? 1 : 0))}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void handleCreateOrganization()}
                  onMouseEnter={() => handleMentionHover(mentionOptions.length + (showCreateCharacterOption ? 1 : 0))}
                  disabled={isCreatingMentionCharacter}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-mono text-sm transition-colors ${
                    mentionHighlightIndex === (mentionOptions.length + (showCreateCharacterOption ? 1 : 0))
                      ? "bg-[#1a1a3e] text-[#fff89c]"
                      : "text-[#fcee0c] hover:bg-[#11112b]"
                  } ${isCreatingMentionCharacter ? "opacity-60" : ""}`}
                >
                  <span className="font-semibold">
                    {isCreatingMentionCharacter ? "Creating…" : `Create "${trimmedMentionQuery}"`}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#fcee0c]">
                    New Organization
                  </span>
                </button>
              ) : null}
              {showCreateSessionOption ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={mentionHighlightIndex === (mentionOptions.length + (showCreateCharacterOption ? 1 : 0) + (showCreateOrganizationOption ? 1 : 0))}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void handleCreateSession()}
                  onMouseEnter={() => handleMentionHover(mentionOptions.length + (showCreateCharacterOption ? 1 : 0) + (showCreateOrganizationOption ? 1 : 0))}
                  disabled={isCreatingMentionCharacter}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-mono text-sm transition-colors ${
                    mentionHighlightIndex === (mentionOptions.length + (showCreateCharacterOption ? 1 : 0) + (showCreateOrganizationOption ? 1 : 0))
                      ? "bg-[#1a1a3e] text-[#ff94e3]"
                      : "text-[#ff6ad5] hover:bg-[#11112b]"
                  } ${isCreatingMentionCharacter ? "opacity-60" : ""}`}
                >
                  <span className="font-semibold">
                    {isCreatingMentionCharacter ? "Creating…" : `Create "${trimmedMentionQuery}"`}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#ff6ad5]">
                    New Session
                  </span>
                </button>
              ) : null}
              {showCreateCampaignOption ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={mentionHighlightIndex === (mentionOptions.length + (showCreateCharacterOption ? 1 : 0) + (showCreateOrganizationOption ? 1 : 0) + (showCreateSessionOption ? 1 : 0))}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void handleCreateCampaign()}
                  onMouseEnter={() => handleMentionHover(mentionOptions.length + (showCreateCharacterOption ? 1 : 0) + (showCreateOrganizationOption ? 1 : 0) + (showCreateSessionOption ? 1 : 0))}
                  disabled={isCreatingMentionCharacter}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-mono text-sm transition-colors ${
                    mentionHighlightIndex === (mentionOptions.length + (showCreateCharacterOption ? 1 : 0) + (showCreateOrganizationOption ? 1 : 0) + (showCreateSessionOption ? 1 : 0))
                      ? "bg-[#1a1a3e] text-[#ff8a5b]"
                      : "text-[#ff6b35] hover:bg-[#11112b]"
                  } ${isCreatingMentionCharacter ? "opacity-60" : ""}`}
                >
                  <span className="font-semibold">
                    {isCreatingMentionCharacter ? "Creating…" : `Create "${trimmedMentionQuery}"`}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#ff6b35]">
                    New Campaign
                  </span>
                </button>
              ) : null}
            </>
          )}
          </div>,
          document.body
        )}
      {mentionCreationError ? (
        <p className="mt-2 text-xs font-mono text-[#ff6ad5]">
          {mentionCreationError}
        </p>
      ) : null}
    </div>
  )
}
