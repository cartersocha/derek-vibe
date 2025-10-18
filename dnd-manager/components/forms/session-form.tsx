'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent } from 'react'
import Link from 'next/link'
import ImageUpload from '@/components/ui/image-upload'
import AutoResizeTextarea from '@/components/ui/auto-resize-textarea'
import { isMentionBoundary } from '@/lib/mention-utils'
import { createCharacterInline } from '@/lib/actions/characters'

const AUTO_SAVE_DELAY_MS = 2000
const DEFAULT_DRAFT_KEY = 'session-notes:draft'
const CHARACTER_SELECTION_SUFFIX = ':characters'
const NAME_SUFFIX = ':name'
const HEADER_IMAGE_SUFFIX = ':header-image'

interface Campaign {
  id: string
  name: string
}

interface Character {
  id: string
  name: string
  race: string | null
  class: string | null
}

interface SessionFormProps {
  action: (formData: FormData) => Promise<void>
  initialData?: {
    name?: string
    campaign_id?: string | null
    session_date?: string | null
    notes?: string | null
    header_image_url?: string | null
    characterIds?: string[]
  }
  campaigns: Campaign[]
  characters: Character[]
  defaultCampaignId?: string
  submitLabel?: string
  cancelHref?: string
  draftKey?: string
  newCharacterHref?: string
  preselectedCharacterIds?: string[]
}

export default function SessionForm({
  action,
  initialData,
  campaigns,
  characters,
  defaultCampaignId,
  submitLabel = 'Create Session',
  cancelHref = '/sessions',
  draftKey,
  newCharacterHref,
  preselectedCharacterIds,
}: SessionFormProps) {
  const draftStorageKey = draftKey ?? DEFAULT_DRAFT_KEY
  const initialName = initialData?.name ?? ''
  const initialNotes = initialData?.notes ?? ''
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [nameDraft, setNameDraft] = useState(initialName)
  const [notesDraft, setNotesDraft] = useState(initialNotes)
  const notesRef = useRef<HTMLTextAreaElement | null>(null)
  const pendingCursorRef = useRef<number | null>(null)
  const [headerImageDraft, setHeaderImageDraft] = useState<{ dataUrl: string; name?: string | null } | null>(null)
  const [characterList, setCharacterList] = useState(characters)
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(() => {
    const initialSet = new Set(initialData?.characterIds || [])
    preselectedCharacterIds?.forEach((id) => initialSet.add(id))
    return initialSet
  })
  const [characterSearch, setCharacterSearch] = useState('')
  const deferredCharacterSearch = useDeferredValue(characterSearch)
  const saveTimeoutRef = useRef<number | null>(null)
  const characterSaveTimeoutRef = useRef<number | null>(null)
  const nameSaveTimeoutRef = useRef<number | null>(null)
  const headerSaveTimeoutRef = useRef<number | null>(null)
  const hasLoadedDraftRef = useRef(false)
  const hasLoadedCharactersRef = useRef(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [isMentionMenuOpen, setIsMentionMenuOpen] = useState(false)
  const [mentionHighlightIndex, setMentionHighlightIndex] = useState(0)
  const [mentionDropdownPosition, setMentionDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null)
  const [isCreatingMentionCharacter, setIsCreatingMentionCharacter] = useState(false)
  const [mentionCreationError, setMentionCreationError] = useState<string | null>(null)
  const mentionListId = useMemo(() => `session-notes-mentions-${draftStorageKey}`, [draftStorageKey])
  const charactersStorageKey = `${draftStorageKey}${CHARACTER_SELECTION_SUFFIX}`
  const nameStorageKey = `${draftStorageKey}${NAME_SUFFIX}`
  const headerImageStorageKey = `${draftStorageKey}${HEADER_IMAGE_SUFFIX}`
  const isNavigatingRef = useRef(false)

  useEffect(() => {
    setCharacterList(characters)
  }, [characters])

  useEffect(() => {
    hasLoadedDraftRef.current = false
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    if (typeof window === 'undefined') {
      setNotesDraft(initialNotes)
      hasLoadedDraftRef.current = true
      return
    }

    const stored = window.localStorage.getItem(draftStorageKey)
    if (stored !== null) {
      setNotesDraft(stored)
    } else {
      setNotesDraft(initialNotes)
    }
    hasLoadedDraftRef.current = true
  }, [draftStorageKey, initialNotes])

  useEffect(() => {
    if (nameSaveTimeoutRef.current) {
      clearTimeout(nameSaveTimeoutRef.current)
      nameSaveTimeoutRef.current = null
    }

    if (typeof window === 'undefined') {
      setNameDraft(initialName)
      return
    }

    const stored = window.localStorage.getItem(nameStorageKey)
    if (stored !== null) {
      setNameDraft(stored)
    } else {
      setNameDraft(initialName)
    }
  }, [initialName, nameStorageKey])

  useEffect(() => {
    hasLoadedCharactersRef.current = false
    if (characterSaveTimeoutRef.current) {
      clearTimeout(characterSaveTimeoutRef.current)
      characterSaveTimeoutRef.current = null
    }

    if (typeof window === 'undefined') {
      hasLoadedCharactersRef.current = true
      return
    }

    try {
      const stored = window.localStorage.getItem(charactersStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const validIds = new Set(
            parsed.filter((value): value is string => typeof value === 'string')
          )
          if (validIds.size > 0) {
            setSelectedCharacters((prev) => {
              const next = new Set(prev)
              validIds.forEach((id) => next.add(id))
              return next
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse stored character selections', error)
      window.localStorage.removeItem(charactersStorageKey)
    }

    hasLoadedCharactersRef.current = true
  }, [charactersStorageKey])

  useEffect(() => {
    if (headerSaveTimeoutRef.current) {
      clearTimeout(headerSaveTimeoutRef.current)
      headerSaveTimeoutRef.current = null
    }

    if (typeof window === 'undefined') {
      setHeaderImageDraft(null)
      return
    }

    try {
      const stored = window.localStorage.getItem(headerImageStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as { dataUrl?: string; name?: string | null }
        if (parsed?.dataUrl) {
          setHeaderImageDraft({ dataUrl: parsed.dataUrl, name: parsed.name })
        } else {
          setHeaderImageDraft(null)
        }
      } else {
        setHeaderImageDraft(null)
      }
    } catch (error) {
      console.error('Failed to parse stored header image draft', error)
      window.localStorage.removeItem(headerImageStorageKey)
      setHeaderImageDraft(null)
    }
  }, [headerImageStorageKey])

  useEffect(() => {
    if (!hasLoadedDraftRef.current) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      if (!notesDraft) {
        window.localStorage.removeItem(draftStorageKey)
      } else {
        window.localStorage.setItem(draftStorageKey, notesDraft)
      }
      saveTimeoutRef.current = null
    }, AUTO_SAVE_DELAY_MS)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [notesDraft, draftStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (nameSaveTimeoutRef.current) {
      clearTimeout(nameSaveTimeoutRef.current)
    }

    nameSaveTimeoutRef.current = window.setTimeout(() => {
      if (!nameDraft) {
        window.localStorage.removeItem(nameStorageKey)
      } else {
        try {
          window.localStorage.setItem(nameStorageKey, nameDraft)
        } catch (error) {
          console.error('Failed to persist session name draft', error)
        }
      }
      nameSaveTimeoutRef.current = null
    }, AUTO_SAVE_DELAY_MS)

    return () => {
      if (nameSaveTimeoutRef.current) {
        clearTimeout(nameSaveTimeoutRef.current)
        nameSaveTimeoutRef.current = null
      }
    }
  }, [nameDraft, nameStorageKey])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      if (characterSaveTimeoutRef.current) {
        clearTimeout(characterSaveTimeoutRef.current)
        characterSaveTimeoutRef.current = null
      }
      if (nameSaveTimeoutRef.current) {
        clearTimeout(nameSaveTimeoutRef.current)
        nameSaveTimeoutRef.current = null
      }
      if (headerSaveTimeoutRef.current) {
        clearTimeout(headerSaveTimeoutRef.current)
        headerSaveTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!preselectedCharacterIds?.length) {
      return
    }

    setSelectedCharacters((prev) => {
      const next = new Set(prev)
      let changed = false
      preselectedCharacterIds.forEach((id) => {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [preselectedCharacterIds])

  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setNameDraft(event.target.value)
  }, [])

  const handleHeaderImageChange = useCallback(
    (file: File | null, dataUrl: string | null) => {
      if (!file || !dataUrl) {
        setHeaderImageDraft(null)
        return
      }

      setHeaderImageDraft({ dataUrl, name: file.name })
    },
    []
  )

  const handleFormSubmit = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (characterSaveTimeoutRef.current) {
      clearTimeout(characterSaveTimeoutRef.current)
    }
    if (typeof window === 'undefined') {
      return
    }
    if (!draftStorageKey) {
      return
    }
    isNavigatingRef.current = true
    window.localStorage.removeItem(draftStorageKey)
    window.localStorage.removeItem(charactersStorageKey)
    window.localStorage.removeItem(nameStorageKey)
    window.localStorage.removeItem(headerImageStorageKey)
  }, [charactersStorageKey, draftStorageKey, headerImageStorageKey, nameStorageKey])

  const toggleCharacter = useCallback((characterId: string) => {
    setSelectedCharacters((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(characterId)) {
        newSet.delete(characterId)
      } else {
        newSet.add(characterId)
      }
      return newSet
    })
  }, [])

  const filteredCharacters = useMemo(() => {
    const term = deferredCharacterSearch.trim().toLowerCase()
    if (!term) {
      return characterList
    }

    return characterList.filter((character) => {
      const parts = [character.name, character.race ?? '', character.class ?? '']
      return parts.some((part) => part.toLowerCase().includes(term))
    })
  }, [characterList, deferredCharacterSearch])

  const hiddenSelectedCharacterIds = useMemo(() => {
    const visibleIds = new Set(filteredCharacters.map((character) => character.id))
    return Array.from(selectedCharacters).filter((id) => !visibleIds.has(id))
  }, [filteredCharacters, selectedCharacters])

  const sortCharactersByName = useCallback(
    (list: Character[]) => [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    []
  )

  const closeMentionMenu = useCallback(() => {
    setIsMentionMenuOpen(false)
    setMentionQuery('')
    setMentionStart(null)
    setMentionHighlightIndex(0)
    setMentionCreationError(null)
    setMentionDropdownPosition(null)
  }, [])

  const measureCaretPosition = useCallback((textarea: HTMLTextAreaElement, index: number) => {
    if (typeof window === 'undefined') {
      return null
    }

    const doc = textarea.ownerDocument
    const textBefore = textarea.value.slice(0, index).replace(/\n$/u, '\n\u200b')
    const marker = doc.createElement('span')
    marker.textContent = '\u200b'

    const mirror = doc.createElement('div')
    const computed = window.getComputedStyle(textarea)

    mirror.style.position = 'absolute'
    mirror.style.visibility = 'hidden'
    mirror.style.whiteSpace = 'pre-wrap'
    mirror.style.wordBreak = 'break-word'
    mirror.style.overflow = 'hidden'
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
      const minWidth = Math.min(Math.max(fontSize * 8, 140), textarea.clientWidth || fontSize * 12)
      const dropdownWidth = Math.min(Math.max(desiredWidth, minWidth), textarea.clientWidth || desiredWidth)
      const availableLeft = Math.max(textarea.clientWidth - dropdownWidth, 0)
      const left = Math.min(Math.max(metrics.left, 0), availableLeft)
      const top = metrics.top + metrics.lineHeight + 6

      setMentionDropdownPosition((prev) => {
        if (prev && prev.top === top && prev.left === left && prev.width === dropdownWidth) {
          return prev
        }
        return {
          top,
          left,
          width: dropdownWidth,
        }
      })
    },
    [measureCaretPosition]
  )

  const updateMentionState = useCallback(
    (value: string, cursor: number, textarea?: HTMLTextAreaElement | null) => {
      if (Number.isNaN(cursor) || cursor < 0) {
        closeMentionMenu()
        return
      }

      const atIndex = value.lastIndexOf('@', cursor - 1)

      if (atIndex === -1) {
        closeMentionMenu()
        return
      }

      if (atIndex > 0) {
        const charBefore = value.charAt(atIndex - 1)
        if (!isMentionBoundary(charBefore)) {
          closeMentionMenu()
          return
        }
      }

      const fragment = value.slice(atIndex + 1, cursor)

      if (fragment.includes('\n') || fragment.includes('\r') || fragment.includes('\t')) {
        closeMentionMenu()
        return
      }

      if (fragment.includes(' ')) {
        closeMentionMenu()
        return
      }

      if (fragment.includes('@')) {
        closeMentionMenu()
        return
      }

      setMentionStart(atIndex)
      setMentionQuery(fragment)
      setIsMentionMenuOpen(true)
      setMentionHighlightIndex(0)
      updateMentionMenuPosition(textarea ?? null, atIndex, [])
    },
    [closeMentionMenu, updateMentionMenuPosition]
  )

  const handleNotesChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const { value, selectionStart } = event.target
    setNotesDraft(value)
    const cursor = typeof selectionStart === 'number' ? selectionStart : value.length
    updateMentionState(value, cursor, event.target)
  }, [updateMentionState])

  const handleNotesCaretUpdate = useCallback(() => {
    const textarea = notesRef.current
    if (!textarea) {
      return
    }
    const cursor = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : textarea.value.length
    updateMentionState(textarea.value, cursor, textarea)
  }, [updateMentionState])

  const handleNotesBlur = useCallback(() => {
    closeMentionMenu()
  }, [closeMentionMenu])

  const mentionQueryNormalized = useMemo(() => mentionQuery.trim(), [mentionQuery])

  const mentionOptions = useMemo(() => {
    if (!isMentionMenuOpen) {
      return [] as Character[]
    }

    const normalizedQuery = mentionQueryNormalized.toLowerCase()
    const candidates = sortCharactersByName(characterList)

    if (!normalizedQuery) {
      return candidates.slice(0, 8)
    }

    return candidates
      .filter((character) => character.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 8)
  }, [characterList, isMentionMenuOpen, mentionQueryNormalized, sortCharactersByName])

  const hasExactMentionMatch = useMemo(() => {
    if (!mentionQueryNormalized) {
      return false
    }
    const lowered = mentionQueryNormalized.toLowerCase()
    return characterList.some((character) => character.name.toLowerCase() === lowered)
  }, [characterList, mentionQueryNormalized])

  const showInlineCreateOption = mentionQueryNormalized.length > 0 && !hasExactMentionMatch

  const totalMentionChoices = mentionOptions.length + (showInlineCreateOption ? 1 : 0)

  const mentionDropdownStyle = useMemo<CSSProperties>(() => {
    if (!mentionDropdownPosition) {
      return {
        top: 'calc(100% + 0.5rem)',
        left: 0,
        minWidth: '12rem',
        width: 'fit-content',
        maxWidth: '100%',
      }
    }

    return {
      top: mentionDropdownPosition.top,
      left: mentionDropdownPosition.left,
      width: mentionDropdownPosition.width,
      minWidth: mentionDropdownPosition.width,
      maxWidth: mentionDropdownPosition.width,
    }
  }, [mentionDropdownPosition])

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

  useEffect(() => {
    if (!isMentionMenuOpen) {
      return
    }

    const textarea = notesRef.current
    if (!textarea) {
      return
    }

    const anchorIndex = mentionStart ?? (typeof textarea.selectionStart === 'number' ? textarea.selectionStart : 0)
    const labels: string[] = mentionOptions.map((option) => option.name)
    if (showInlineCreateOption) {
      labels.push(`Create "${mentionQueryNormalized}"`)
    }

    updateMentionMenuPosition(textarea, anchorIndex, labels)
  }, [isMentionMenuOpen, mentionOptions, mentionQueryNormalized, mentionStart, showInlineCreateOption, updateMentionMenuPosition])

  const insertMention = useCallback((character: Character) => {
    const textarea = notesRef.current
    if (!textarea) {
      return
    }

    const rawStart = mentionStart ?? textarea.selectionStart ?? 0
    const rawEnd = textarea.selectionEnd ?? rawStart
    const mentionText = `@${character.name}`

    setNotesDraft((previous) => {
      const safeStart = Math.max(0, Math.min(rawStart, previous.length))
      const safeEnd = Math.max(safeStart, Math.min(rawEnd, previous.length))
      const before = previous.slice(0, safeStart)
      const after = previous.slice(safeEnd)
      const needsSpace = after.length === 0 ? true : !isMentionBoundary(after.charAt(0))
      const insertion = needsSpace ? `${mentionText} ` : mentionText
      pendingCursorRef.current = safeStart + insertion.length
      return `${before}${insertion}${after}`
    })

    setSelectedCharacters((prev) => {
      if (prev.has(character.id)) {
        return prev
      }
      const next = new Set(prev)
      next.add(character.id)
      return next
    })

    closeMentionMenu()

    requestAnimationFrame(() => {
      const textareaNode = notesRef.current
      const nextCursor = pendingCursorRef.current
      if (!textareaNode || nextCursor === null) {
        return
      }
      textareaNode.focus()
      textareaNode.setSelectionRange(nextCursor, nextCursor)
      pendingCursorRef.current = null
    })
  }, [closeMentionMenu, mentionStart])

  const handleCreateCharacterInline = useCallback(async () => {
    if (isCreatingMentionCharacter) {
      return
    }

    const rawName = mentionQueryNormalized

    if (!rawName || hasExactMentionMatch) {
      return
    }

    setIsCreatingMentionCharacter(true)
    setMentionCreationError(null)

    try {
      const result = await createCharacterInline(rawName)
      const newCharacter: Character = {
        id: result.id,
        name: result.name,
        race: null,
        class: null,
      }

      setCharacterList((previous) => sortCharactersByName([...previous, newCharacter]))
      insertMention(newCharacter)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create character'
      setMentionCreationError(message)
    } finally {
      setIsCreatingMentionCharacter(false)
    }
  }, [hasExactMentionMatch, insertMention, isCreatingMentionCharacter, mentionQueryNormalized, sortCharactersByName])

  const handleNotesKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isMentionMenuOpen) {
      return
    }

    if (mentionOptions.length === 0) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMentionMenu()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setMentionHighlightIndex((prev) => (prev + 1) % totalMentionChoices)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setMentionHighlightIndex((prev) => (prev - 1 + totalMentionChoices) % totalMentionChoices)
      return
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      if (mentionHighlightIndex < mentionOptions.length) {
        const target = mentionOptions[mentionHighlightIndex]
        if (target) {
          insertMention(target)
        }
      } else if (showInlineCreateOption) {
        void handleCreateCharacterInline()
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMentionMenu()
    }
  }, [closeMentionMenu, handleCreateCharacterInline, insertMention, isMentionMenuOpen, mentionHighlightIndex, mentionOptions, showInlineCreateOption, totalMentionChoices])

  const handleCharacterSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCharacterSearch(event.target.value)
  }, [])

  useEffect(() => {
    if (!hasLoadedCharactersRef.current) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }

    if (characterSaveTimeoutRef.current) {
      clearTimeout(characterSaveTimeoutRef.current)
    }

    characterSaveTimeoutRef.current = window.setTimeout(() => {
      const values = Array.from(selectedCharacters)
      if (values.length === 0) {
        window.localStorage.removeItem(charactersStorageKey)
      } else {
        window.localStorage.setItem(charactersStorageKey, JSON.stringify(values))
      }
      characterSaveTimeoutRef.current = null
    }, AUTO_SAVE_DELAY_MS)

    return () => {
      if (characterSaveTimeoutRef.current) {
        clearTimeout(characterSaveTimeoutRef.current)
        characterSaveTimeoutRef.current = null
      }
    }
  }, [selectedCharacters, charactersStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (headerSaveTimeoutRef.current) {
      clearTimeout(headerSaveTimeoutRef.current)
    }

    headerSaveTimeoutRef.current = window.setTimeout(() => {
      if (!headerImageDraft) {
        window.localStorage.removeItem(headerImageStorageKey)
      } else {
        try {
          window.localStorage.setItem(
            headerImageStorageKey,
            JSON.stringify(headerImageDraft)
          )
        } catch (error) {
          console.error('Failed to persist session header image draft', error)
        }
      }
      headerSaveTimeoutRef.current = null
    }, AUTO_SAVE_DELAY_MS)

    return () => {
      if (headerSaveTimeoutRef.current) {
        clearTimeout(headerSaveTimeoutRef.current)
        headerSaveTimeoutRef.current = null
      }
    }
  }, [headerImageDraft, headerImageStorageKey])

  return (
    <form
      action={action}
      encType="multipart/form-data"
      onSubmit={handleFormSubmit}
      className="bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6 space-y-6"
    >
      {/* Header Image Upload */}
      <ImageUpload
        name="header_image"
        label="Session Header Image"
        currentImage={initialData?.header_image_url}
        maxSize={5}
        initialCachedFile={headerImageDraft ?? undefined}
        onFileChange={handleHeaderImageChange}
      />

      {/* Session Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Session Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={nameDraft}
          onChange={handleNameChange}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          placeholder="Enter session name"
        />
      </div>

      {/* Campaign Selection */}
      <div>
        <label htmlFor="campaign_id" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Campaign
        </label>
        <select
          id="campaign_id"
          name="campaign_id"
          defaultValue={initialData?.campaign_id || defaultCampaignId || ''}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
        >
          <option value="">No campaign</option>
          {campaigns?.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      {/* Session Date */}
      <div>
        <label htmlFor="session_date" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Session Date
        </label>
        <input
          type="date"
          id="session_date"
          name="session_date"
          defaultValue={initialData?.session_date || today}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
        />
      </div>

      {/* Session Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-bold text-[#00ffff] mb-2 uppercase tracking-wider">
          Session Notes
        </label>
        <div className="relative">
          <AutoResizeTextarea
            ref={notesRef}
            id="notes"
            name="notes"
            rows={8}
            value={notesDraft}
            onChange={handleNotesChange}
            onKeyDown={handleNotesKeyDown}
            onClick={handleNotesCaretUpdate}
            onKeyUp={handleNotesCaretUpdate}
            onFocus={handleNotesCaretUpdate}
            onBlur={handleNotesBlur}
            aria-autocomplete="list"
            aria-expanded={isMentionMenuOpen}
            aria-controls={isMentionMenuOpen ? mentionListId : undefined}
            className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
            placeholder="What happened in this session..."
          />
          {isMentionMenuOpen && (
            <div
              id={mentionListId}
              role="listbox"
              className="absolute z-20 max-h-56 overflow-y-auto rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-lg"
              style={mentionDropdownStyle}
            >
              {mentionOptions.map((character, index) => {
                const isActive = index === mentionHighlightIndex
                return (
                  <button
                    key={character.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => insertMention(character)}
                    onMouseEnter={() => setMentionHighlightIndex(index)}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left font-mono text-sm transition-colors ${
                      isActive
                        ? 'bg-[#1a1a3e] text-[#ff00ff]'
                        : 'text-[#00ffff] hover:bg-[#11112b]'
                    }`}
                  >
                    <span className="font-semibold">{character.name}</span>
                  </button>
                )
              })}

              {showInlineCreateOption && (
                <button
                  type="button"
                  role="option"
                  aria-selected={mentionHighlightIndex === mentionOptions.length}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setMentionHighlightIndex(mentionOptions.length)}
                  onClick={() => void handleCreateCharacterInline()}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left font-mono text-sm transition-colors ${
                    mentionHighlightIndex === mentionOptions.length
                      ? 'bg-[#1a1a3e] text-[#ff00ff]'
                      : 'text-[#ff00ff] hover:bg-[#11112b]'
                  }`}
                  disabled={isCreatingMentionCharacter}
                >
                  <span className="font-semibold">
                    {isCreatingMentionCharacter ? 'Creating…' : `Create "${mentionQueryNormalized}"`}
                  </span>
                </button>
              )}

              {!showInlineCreateOption && mentionOptions.length === 0 && (
                <p className="px-3 py-2 text-xs font-mono uppercase tracking-widest text-gray-500">
                  No matching characters
                </p>
              )}
            </div>
          )}
          {mentionCreationError && (
            <p className="mt-2 text-xs font-mono text-[#ff6ad5]">
              {mentionCreationError}
            </p>
          )}
        </div>
      </div>

          {hiddenSelectedCharacterIds.map((id) => (
            <input key={`selected-hidden-${id}`} type="hidden" name="character_ids" value={id} />
          ))}

      {/* Characters Present */}
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-bold text-[#00ffff] uppercase tracking-wider">
                Related Characters
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <input
                  type="search"
                  value={characterSearch}
                  onChange={handleCharacterSearchChange}
                  placeholder="Search characters"
                  className="w-full sm:w-64 rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] px-3 py-2 text-sm font-mono text-[#00ffff] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ffff]"
                />
                {newCharacterHref && (
                  <Link
                    href={newCharacterHref}
                    className="inline-flex items-center justify-center rounded border border-[#00ffff] border-opacity-30 px-3 py-2 text-xs font-bold uppercase tracking-[0.25em] text-[#00ffff] transition-colors duration-200 hover:border-[#ff00ff] hover:text-[#ff00ff]"
                  >
                    New Character
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto border border-[#00ffff] border-opacity-30 rounded p-4 bg-[#0f0f23]">
              {filteredCharacters.length === 0 ? (
                <p className="text-xs uppercase tracking-wider text-gray-500 font-mono text-center">
                  {characterList.length === 0
                    ? 'No characters yet. Create one to get started.'
                    : 'No characters match your search'}
                </p>
              ) : (
                filteredCharacters.map((character) => (
                  <label key={character.id} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="character_ids"
                      value={character.id}
                      checked={selectedCharacters.has(character.id)}
                      onChange={() => toggleCharacter(character.id)}
                      className="rounded border-[#00ffff] border-opacity-30 text-[#ff00ff] focus:ring-[#ff00ff] bg-[#0f0f23]"
                    />
                    <span className="text-[#00ffff] font-mono group-hover:text-[#ff00ff] transition-colors">
                      {character.name}
                      {(character.race || character.class) && (
                        <span className="text-gray-500 text-sm ml-2">
                          {[character.race, character.class].filter(Boolean).join(' • ')}
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="submit"
          className="flex-1 bg-[#ff00ff] text-black px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[#cc00cc] transition-all duration-200 shadow-lg shadow-[#ff00ff]/50"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="flex-1 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded hover:border-[#ff00ff] hover:text-[#ff00ff] transition-all duration-200 text-center font-bold uppercase tracking-wider"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
