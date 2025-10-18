"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react"
import AutoResizeTextarea, { type AutoResizeTextareaProps } from "@/components/ui/auto-resize-textarea"
import { cn } from "@/lib/utils"
import { isMentionBoundary, type MentionTarget } from "@/lib/mention-utils"

type MentionableTextareaProps = Omit<AutoResizeTextareaProps, "defaultValue" | "value" | "onChange" | "onKeyDown" | "onSelect" | "onBlur"> & {
  initialValue?: string | null
  mentionTargets: MentionTarget[]
  onValueChange?: (value: string) => void
  menuMaxHeight?: number
}

type MentionOption = MentionTarget

type MentionKindLabelProps = {
  kind: MentionOption["kind"]
}

function MentionKindLabel({ kind }: MentionKindLabelProps) {
  if (kind === "character") {
    return (
      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
        Char
      </span>
    )
  }

  return (
    <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
      Session
    </span>
  )
}

export default function MentionableTextarea({
  initialValue,
  mentionTargets,
  onValueChange,
  menuMaxHeight = 224,
  className,
  ...rest
}: MentionableTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [value, setValue] = useState(() => initialValue ?? "")
  const [isMentionMenuOpen, setIsMentionMenuOpen] = useState(false)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionHighlightIndex, setMentionHighlightIndex] = useState(0)

  const normalizedMentionQuery = mentionQuery.trim().toLowerCase()

  useEffect(() => {
    setValue(initialValue ?? "")
  }, [initialValue])

  const mentionOptions = useMemo(() => {
    const entries = normalizedMentionQuery
      ? mentionTargets.filter((target) => target.name.toLowerCase().includes(normalizedMentionQuery))
      : mentionTargets
    return entries.slice(0, 12)
  }, [mentionTargets, normalizedMentionQuery])

  const closeMentionMenu = useCallback(() => {
    setIsMentionMenuOpen(false)
    setMentionStart(null)
    setMentionQuery("")
    setMentionHighlightIndex(0)
  }, [])

  const updateMentionState = useCallback(
    (draft: string, caretIndex: number) => {
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

      if (/[\s\n\r\t]/.test(query)) {
        closeMentionMenu()
        return
      }

      setIsMentionMenuOpen(true)
      setMentionStart(atIndex)
      setMentionQuery(query)
      setMentionHighlightIndex(0)
    },
    [closeMentionMenu]
  )

  const handleValueChange = useCallback(
    (next: string, caretIndex: number) => {
      setValue(next)
      onValueChange?.(next)
      updateMentionState(next, caretIndex)
    },
    [onValueChange, updateMentionState]
  )

  const handleTextareaChange = useCallback(
  (event: ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = event.target.value
      const caret = event.target.selectionStart ?? nextValue.length
      handleValueChange(nextValue, caret)
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
      const needsSpace = after.length === 0 ? true : !isMentionBoundary(after.charAt(0))
      const insertion = needsSpace ? `${mentionText} ` : mentionText
      const nextValue = `${before}${insertion}${after}`

      setValue(nextValue)
      onValueChange?.(nextValue)
      closeMentionMenu()

      requestAnimationFrame(() => {
        const node = textareaRef.current
        if (!node) {
          return
        }
        const cursor = safeStart + insertion.length
        node.focus()
        node.setSelectionRange(cursor, cursor)
        updateMentionState(nextValue, cursor)
      })
    },
    [closeMentionMenu, mentionStart, onValueChange, updateMentionState, value]
  )

  const handleTextareaSelect = useCallback(
  (event: SyntheticEvent<HTMLTextAreaElement>) => {
      const caret = event.currentTarget.selectionStart ?? event.currentTarget.value.length
      updateMentionState(event.currentTarget.value, caret)
    },
    [updateMentionState]
  )

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isMentionMenuOpen) {
        return
      }

      if (mentionOptions.length === 0) {
        if (event.key === "Escape") {
          event.preventDefault()
          closeMentionMenu()
        }
        return
      }

      if (event.key === "ArrowDown") {
        event.preventDefault()
        setMentionHighlightIndex((prev) => (prev + 1) % mentionOptions.length)
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        setMentionHighlightIndex((prev) => (prev - 1 + mentionOptions.length) % mentionOptions.length)
        return
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        const option = mentionOptions[mentionHighlightIndex]
        if (option) {
          insertMention(option)
        }
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        closeMentionMenu()
      }
    },
    [closeMentionMenu, insertMention, isMentionMenuOpen, mentionHighlightIndex, mentionOptions]
  )

  const handleMentionClick = useCallback(
    (option: MentionOption) => {
      insertMention(option)
    },
    [insertMention]
  )

  return (
    <div className="relative">
      <AutoResizeTextarea
        {...rest}
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleTextareaKeyDown}
        onSelect={handleTextareaSelect}
        className={cn("pr-3", className)}
      />

      {isMentionMenuOpen && (
        <div
          className="absolute z-20 max-h-56 overflow-y-auto rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-lg"
          role="listbox"
          style={{ left: 0, right: 0, top: "100%", marginTop: "0.25rem" }}
        >
          {mentionOptions.length === 0 ? (
            <p className="px-3 py-2 text-xs font-mono uppercase tracking-widest text-gray-500">
              No matches
            </p>
          ) : (
            <>
              {mentionOptions.map((option, index) => {
                const isActive = index === mentionHighlightIndex
                return (
                  <button
                    key={`${option.kind}-${option.id}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleMentionClick(option)}
                    onMouseEnter={() => setMentionHighlightIndex(index)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-mono text-sm transition-colors ${
                      isActive ? "bg-[#1a1a3e] text-[#ff00ff]" : "text-[#00ffff] hover:bg-[#11112b]"
                    }`}
                  >
                    <span className="font-semibold">{option.name}</span>
                    <MentionKindLabel kind={option.kind} />
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
