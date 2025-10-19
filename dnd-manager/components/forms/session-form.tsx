'use client'

import dynamic from 'next/dynamic'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import MentionableTextarea from '@/components/ui/mentionable-textarea'
import { collectMentionTargets, type MentionTarget } from '@/lib/mention-utils'
import { createCampaignInline } from '@/lib/actions/campaigns'

const ImageUpload = dynamic(() => import('@/components/ui/image-upload'), { ssr: false })
const SynthwaveDropdown = dynamic(() => import('@/components/ui/synthwave-dropdown'))

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

function sortCampaignsByName(list: Campaign[]): Campaign[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
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
  mentionTargets: MentionTarget[]
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
  mentionTargets,
}: SessionFormProps) {
  const draftStorageKey = draftKey ?? DEFAULT_DRAFT_KEY
  const initialName = initialData?.name ?? ''
  const initialNotes = initialData?.notes ?? ''
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [nameDraft, setNameDraft] = useState(initialName)
  const [notesDraft, setNotesDraft] = useState(initialNotes)
  const [headerImageDraft, setHeaderImageDraft] = useState<{ dataUrl: string; name?: string | null } | null>(null)
  const [characterList, setCharacterList] = useState(characters)
  const [mentionableTargets, setMentionableTargets] = useState<MentionTarget[]>(mentionTargets)
  const [campaignList, setCampaignList] = useState(() => sortCampaignsByName(campaigns))
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(() => {
    const initialSet = new Set(initialData?.characterIds || [])
    preselectedCharacterIds?.forEach((id) => initialSet.add(id))
    return initialSet
  })
  const [campaignId, setCampaignId] = useState(() => initialData?.campaign_id || defaultCampaignId || '')
  const [campaignDropdownKey, setCampaignDropdownKey] = useState(0)
  const [isCampaignCreatorOpen, setIsCampaignCreatorOpen] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignDescription, setNewCampaignDescription] = useState('')
  const [isCreatingCampaignInline, setIsCreatingCampaignInline] = useState(false)
  const [campaignCreationError, setCampaignCreationError] = useState<string | null>(null)
  const [characterSearch, setCharacterSearch] = useState('')
  const deferredCharacterSearch = useDeferredValue(characterSearch)
  const draftTimeoutsRef = useRef<Map<string, number>>(new Map())
  const idleCallbackRef = useRef<((callback: IdleRequestCallback) => number) | null>(null)
  const hasLoadedDraftRef = useRef(false)
  const hasLoadedCharactersRef = useRef(false)
  const newCampaignNameInputRef = useRef<HTMLInputElement | null>(null)
  const charactersStorageKey = `${draftStorageKey}${CHARACTER_SELECTION_SUFFIX}`
  const nameStorageKey = `${draftStorageKey}${NAME_SUFFIX}`
  const headerImageStorageKey = `${draftStorageKey}${HEADER_IMAGE_SUFFIX}`
  const isNavigatingRef = useRef(false)
  const cancelDraftUpdate = useCallback((key: string) => {
    if (typeof window === 'undefined') {
      return
    }
    const timeouts = draftTimeoutsRef.current
    const existing = timeouts.get(key)
    if (existing !== undefined) {
      window.clearTimeout(existing)
      timeouts.delete(key)
    }
  }, [])

  const scheduleDraftUpdate = useCallback(
    (key: string, work: () => void) => {
      if (typeof window === 'undefined') {
        work()
        return
      }

      const timeouts = draftTimeoutsRef.current
      const existing = timeouts.get(key)
      if (existing) {
        window.clearTimeout(existing)
      }

      const timerId = window.setTimeout(() => {
        timeouts.delete(key)
        const idle = idleCallbackRef.current
        if (idle) {
          idle(() => work())
        } else {
          work()
        }
      }, AUTO_SAVE_DELAY_MS)

      timeouts.set(key, timerId)
    },
    []
  )

  const campaignOptions = useMemo(() => {
    const base = [{ value: '', label: 'No campaign' }]
    const mapped = campaignList.map((campaign) => ({ value: campaign.id, label: campaign.name }))
    return [...base, ...mapped]
  }, [campaignList])

  useEffect(() => {
    setCharacterList(characters)
  }, [characters])

  useEffect(() => {
    setMentionableTargets((previous) => {
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

  useEffect(() => {
    setCampaignList(sortCampaignsByName(campaigns))
  }, [campaigns])

  useEffect(() => {
    setCampaignId(initialData?.campaign_id || defaultCampaignId || '')
  }, [defaultCampaignId, initialData?.campaign_id])

  useEffect(() => {
    if (!isCampaignCreatorOpen) {
      return
    }
    newCampaignNameInputRef.current?.focus()
  }, [isCampaignCreatorOpen])

  useEffect(() => {
    const timeoutRegistry = draftTimeoutsRef.current

    if (typeof window === 'undefined') {
      idleCallbackRef.current = null
      return
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleCallbackRef.current = (callback) => window.requestIdleCallback(callback)
    } else {
      idleCallbackRef.current = null
    }

    return () => {
      timeoutRegistry.forEach((id) => {
        if (typeof window !== 'undefined') {
          window.clearTimeout(id)
        }
      })
      timeoutRegistry.clear()
      idleCallbackRef.current = null
    }
  }, [])

  useEffect(() => {
    hasLoadedDraftRef.current = false
    cancelDraftUpdate(draftStorageKey)

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
  }, [cancelDraftUpdate, draftStorageKey, initialNotes])

  useEffect(() => {
    cancelDraftUpdate(nameStorageKey)

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
  }, [cancelDraftUpdate, initialName, nameStorageKey])

  useEffect(() => {
    hasLoadedCharactersRef.current = false
    cancelDraftUpdate(charactersStorageKey)

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
  }, [cancelDraftUpdate, charactersStorageKey])

  useEffect(() => {
    cancelDraftUpdate(headerImageStorageKey)

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
  }, [cancelDraftUpdate, headerImageStorageKey])

  useEffect(() => {
    if (!hasLoadedDraftRef.current) {
      return
    }

    scheduleDraftUpdate(draftStorageKey, () => {
      if (typeof window === 'undefined') {
        return
      }
      if (!notesDraft) {
        window.localStorage.removeItem(draftStorageKey)
      } else {
        window.localStorage.setItem(draftStorageKey, notesDraft)
      }
    })

    return () => {
      cancelDraftUpdate(draftStorageKey)
    }
  }, [cancelDraftUpdate, draftStorageKey, notesDraft, scheduleDraftUpdate])

  useEffect(() => {
    scheduleDraftUpdate(nameStorageKey, () => {
      if (typeof window === 'undefined') {
        return
      }
      if (!nameDraft) {
        window.localStorage.removeItem(nameStorageKey)
      } else {
        try {
          window.localStorage.setItem(nameStorageKey, nameDraft)
        } catch (error) {
          console.error('Failed to persist session name draft', error)
        }
      }
    })

    return () => {
      cancelDraftUpdate(nameStorageKey)
    }
  }, [cancelDraftUpdate, nameDraft, nameStorageKey, scheduleDraftUpdate])

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

  const handleCampaignSelectionChange = useCallback((value: string) => {
    setCampaignId(value)
    setIsCampaignCreatorOpen(false)
    setCampaignCreationError(null)
    setNewCampaignName('')
    setNewCampaignDescription('')
  }, [])

  const handleCancelCampaignInline = useCallback(() => {
    setIsCampaignCreatorOpen(false)
    setCampaignCreationError(null)
    setNewCampaignName('')
    setNewCampaignDescription('')
  }, [])

  const handleCampaignCreateInline = useCallback(async () => {
    if (isCreatingCampaignInline) {
      return
    }

    const trimmedName = newCampaignName.trim()
    if (!trimmedName) {
      setCampaignCreationError('Campaign name is required')
      return
    }

    setIsCreatingCampaignInline(true)
    setCampaignCreationError(null)

    try {
      const trimmedDescription = newCampaignDescription.trim()
      const created = await createCampaignInline(trimmedName, trimmedDescription ? trimmedDescription : null)
      const newCampaign: Campaign = { id: created.id, name: created.name }

      setCampaignList((previous) => {
        const existingIndex = previous.findIndex((campaign) => campaign.id === newCampaign.id)
        if (existingIndex !== -1) {
          const updated = [...previous]
          updated[existingIndex] = newCampaign
          return sortCampaignsByName(updated)
        }
        return sortCampaignsByName([...previous, newCampaign])
      })

      setCampaignId(newCampaign.id)
      setIsCampaignCreatorOpen(false)
      setNewCampaignName('')
      setNewCampaignDescription('')
      setCampaignDropdownKey((prev) => prev + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create campaign'
      setCampaignCreationError(message)
    } finally {
      setIsCreatingCampaignInline(false)
    }
  }, [isCreatingCampaignInline, newCampaignDescription, newCampaignName])

  const handleFormSubmit = useCallback(() => {
    cancelDraftUpdate(draftStorageKey)
    cancelDraftUpdate(charactersStorageKey)
    cancelDraftUpdate(nameStorageKey)
    cancelDraftUpdate(headerImageStorageKey)

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
  }, [cancelDraftUpdate, charactersStorageKey, draftStorageKey, headerImageStorageKey, nameStorageKey])

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

  const handleNotesValueChange = useCallback((nextValue: string) => {
    setNotesDraft(nextValue)
  }, [])

  const handleMentionInsert = useCallback(
    (target: MentionTarget) => {
      setMentionableTargets((previous) => {
        if (previous.some((entry) => entry.id === target.id)) {
          return previous
        }
        return [...previous, target]
      })

      if (target.kind !== 'character') {
        return
      }

      setSelectedCharacters((prev) => {
        if (prev.has(target.id)) {
          return prev
        }
        const next = new Set(prev)
        next.add(target.id)
        return next
      })

      setCharacterList((prev) => {
        if (prev.some((character) => character.id === target.id)) {
          return prev
        }
        const next = [...prev, { id: target.id, name: target.name, race: null, class: null }]
        return sortCharactersByName(next)
      })
    },
    [sortCharactersByName]
  )

  useEffect(() => {
    if (!notesDraft) {
      return
    }

    const characterMentions = collectMentionTargets(notesDraft, mentionableTargets, 'character')

    if (characterMentions.length === 0) {
      return
    }

    setSelectedCharacters((prev) => {
      let changed = false
      const next = new Set(prev)
      characterMentions.forEach((target) => {
        if (!next.has(target.id)) {
          next.add(target.id)
          changed = true
        }
      })
      return changed ? next : prev
    })

    setCharacterList((prev) => {
      let changed = false
      const byId = new Map(prev.map((character) => [character.id, character]))
      characterMentions.forEach((target) => {
        if (!byId.has(target.id)) {
          byId.set(target.id, { id: target.id, name: target.name, race: null, class: null })
          changed = true
        }
      })
      if (!changed) {
        return prev
      }
      return sortCharactersByName(Array.from(byId.values()))
    })
  }, [mentionableTargets, notesDraft, sortCharactersByName])

  const handleCharacterSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCharacterSearch(event.target.value)
  }, [])

  const disableCampaignCreate = newCampaignName.trim().length === 0 || isCreatingCampaignInline

  const campaignDropdownFooter = (
    <div className="space-y-2">
      {isCampaignCreatorOpen ? (
        <div className="space-y-2">
          <input
            ref={newCampaignNameInputRef}
            type="text"
            value={newCampaignName}
            onChange={(event) => setNewCampaignName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleCampaignCreateInline()
              }
            }}
            placeholder="Campaign name"
            className="w-full rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] px-3 py-2 text-sm font-mono text-[#00ffff] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff00ff]"
          />
          <textarea
            value={newCampaignDescription}
            onChange={(event) => setNewCampaignDescription(event.target.value)}
            rows={3}
            placeholder="Optional description"
            className="w-full rounded border border-[#00ffff] border-opacity-20 bg-[#0a0a1f] px-3 py-2 text-xs font-mono text-[#00ffff] placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff00ff]"
          />
          {campaignCreationError ? (
            <p className="text-xs font-mono text-[#ff6ad5]">{campaignCreationError}</p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleCampaignCreateInline()}
              disabled={disableCampaignCreate}
              className="flex-1 rounded border border-[#ff00ff] bg-[#ff00ff] px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors duration-200 hover:bg-[#cc00cc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreatingCampaignInline ? 'Creating…' : 'Save Campaign'}
            </button>
            <button
              type="button"
              onClick={handleCancelCampaignInline}
              className="flex-1 rounded border border-[#00ffff] border-opacity-30 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00ffff] transition-colors duration-200 hover:border-[#ff00ff] hover:text-[#ff00ff]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsCampaignCreatorOpen(true)
            setCampaignCreationError(null)
          }}
          className="w-full rounded border border-dashed border-[#00ffff] border-opacity-40 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#00ffff] transition-colors duration-200 hover:border-solid hover:border-[#ff00ff] hover:text-[#ff00ff]"
        >
          + New Campaign
        </button>
      )}
    </div>
  )

  useEffect(() => {
    if (!hasLoadedCharactersRef.current) {
      return
    }

    scheduleDraftUpdate(charactersStorageKey, () => {
      if (typeof window === 'undefined') {
        return
      }
      const values = Array.from(selectedCharacters)
      if (values.length === 0) {
        window.localStorage.removeItem(charactersStorageKey)
      } else {
        window.localStorage.setItem(charactersStorageKey, JSON.stringify(values))
      }
    })

    return () => {
      cancelDraftUpdate(charactersStorageKey)
    }
  }, [cancelDraftUpdate, charactersStorageKey, scheduleDraftUpdate, selectedCharacters])

  useEffect(() => {
    scheduleDraftUpdate(headerImageStorageKey, () => {
      if (typeof window === 'undefined') {
        return
      }
      if (!headerImageDraft) {
        window.localStorage.removeItem(headerImageStorageKey)
      } else {
        try {
          window.localStorage.setItem(headerImageStorageKey, JSON.stringify(headerImageDraft))
        } catch (error) {
          console.error('Failed to persist session header image draft', error)
        }
      }
    })

    return () => {
      cancelDraftUpdate(headerImageStorageKey)
    }
  }, [cancelDraftUpdate, headerImageDraft, headerImageStorageKey, scheduleDraftUpdate])

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
        <SynthwaveDropdown
          key={campaignDropdownKey}
          id="campaign_id"
          name="campaign_id"
          value={campaignId}
          onChange={handleCampaignSelectionChange}
          options={campaignOptions}
          placeholder="Select a campaign"
          hideSearch
          customFooter={campaignDropdownFooter}
        />
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
        <MentionableTextarea
          id="notes"
          name="notes"
          rows={8}
          initialValue={notesDraft}
          mentionTargets={mentionableTargets}
          onValueChange={handleNotesValueChange}
          onMentionInsert={handleMentionInsert}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          placeholder="What happened in this session..."
          spellCheck
        />
        <p className="mt-2 text-xs text-gray-500 font-mono uppercase tracking-wider">
          Use @ to mention characters, sessions, or organizations. Mentioned items are linked automatically.
        </p>
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
