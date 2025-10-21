'use client'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import MentionableTextarea from '@/components/ui/mentionable-textarea'
import ImageUpload from '@/components/ui/image-upload'
import CharacterMultiSelect, { type CharacterOption } from '@/components/ui/character-multi-select'
import OrganizationMultiSelect, { type OrganizationOption } from '@/components/ui/organization-multi-select'
import { collectMentionTargets, type MentionTarget } from '@/lib/mention-utils'
import { getTodayDateInputValue } from '@/lib/utils'
import { createCampaignInline } from '@/lib/actions/campaigns'

import SynthwaveDropdown from '@/components/ui/synthwave-dropdown'

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
  organizations?: Array<{ id: string; name: string }>
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
    organizationIds?: string[]
  }
  campaigns: Campaign[]
  characters: Character[]
  organizations: { id: string; name: string }[]
  defaultCampaignId?: string
  submitLabel?: string
  cancelHref?: string
  draftKey?: string
  preselectedCharacterIds?: string[]
  mentionTargets: MentionTarget[]
}

export default function SessionForm({
  action,
  initialData,
  campaigns,
  characters,
  organizations,
  defaultCampaignId,
  submitLabel = 'Create Session',
  cancelHref = '/sessions',
  draftKey,
  preselectedCharacterIds,
  mentionTargets,
}: SessionFormProps) {
  const draftStorageKey = draftKey ?? DEFAULT_DRAFT_KEY
  const initialName = initialData?.name ?? ''
  const initialNotes = initialData?.notes ?? ''
  const today = useMemo(() => getTodayDateInputValue(), [])
  const [nameDraft, setNameDraft] = useState(initialName)
  const [notesDraft, setNotesDraft] = useState(initialNotes)
  const [headerImageDraft, setHeaderImageDraft] = useState<{ dataUrl: string; name?: string | null } | null>(null)
  const [characterList, setCharacterList] = useState(characters)
const [organizationList, setOrganizationList] = useState(() => [...organizations])
  const [mentionableTargets, setMentionableTargets] = useState<MentionTarget[]>(mentionTargets)
  const [campaignList, setCampaignList] = useState(() => sortCampaignsByName(campaigns))
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(() => {
    const initialSet = new Set(initialData?.characterIds || [])
    preselectedCharacterIds?.forEach((id) => initialSet.add(id))
    return Array.from(initialSet)
  })
  const [selectedGroups, setSelectedGroups] = useState<string[]>(() => {
    // For new sessions, start with empty array
    // For editing sessions, use the existing organizationIds
    return initialData?.organizationIds ?? []
  })
  const [campaignId, setCampaignId] = useState(() => initialData?.campaign_id || defaultCampaignId || '')
  const manuallySelectedOrgsRef = useRef<Set<string>>(new Set())
  const syncedCharactersRef = useRef<Set<string>>(new Set())
  const [campaignDropdownKey, setCampaignDropdownKey] = useState(0)
  const [isCampaignCreatorOpen, setIsCampaignCreatorOpen] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignDescription, setNewCampaignDescription] = useState('')
  const [isCreatingCampaignInline, setIsCreatingCampaignInline] = useState(false)
  const [campaignCreationError, setCampaignCreationError] = useState<string | null>(null)
  const draftTimeoutsRef = useRef<Map<string, number>>(new Map())
  const idleCallbackRef = useRef<((callback: IdleRequestCallback) => number) | null>(null)
  const hasLoadedDraftRef = useRef(false)
  const hasLoadedCharactersRef = useRef(false)
  const newCampaignNameInputRef = useRef<HTMLInputElement | null>(null)
  const charactersStorageKey = `${draftStorageKey}${CHARACTER_SELECTION_SUFFIX}`
  const nameStorageKey = `${draftStorageKey}${NAME_SUFFIX}`
  const headerImageStorageKey = `${draftStorageKey}${HEADER_IMAGE_SUFFIX}`
  const isNavigatingRef = useRef(false)

  const sortCharactersByName = useCallback(
    (list: Character[]) => [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    []
  )
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

  const organizationSelectOptions = useMemo(() => {
    return organizationList.map((organization) => ({
      value: organization.id,
      label: organization.name || 'Untitled Group',
    }))
  }, [organizationList])

  useEffect(() => {
    setCharacterList((previous) => {
      const merged = new Map<string, Character>()
      previous.forEach((entry) => {
        if (entry?.id) {
          merged.set(entry.id, entry)
        }
      })
      characters.forEach((entry) => {
        if (entry?.id) {
          merged.set(entry.id, entry)
        }
      })
      return sortCharactersByName(Array.from(merged.values()))
    })
  }, [characters, sortCharactersByName])

  useEffect(() => {
    setOrganizationList((previous) => {
      const merged = new Map<string, { id: string; name: string }>()
      previous.forEach((entry) => {
        if (entry?.id) {
          merged.set(entry.id, entry)
        }
      })
      organizations.forEach((entry) => {
        if (entry?.id) {
          merged.set(entry.id, entry)
        }
      })
      return Array.from(merged.values()).sort((a, b) =>
        (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' })
      )
    })
  }, [organizations])

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
    const initialOrgIds = initialData?.organizationIds ?? []
    const initialCharIds = initialData?.characterIds ?? []
    
    // For new sessions (no initialData.organizationIds), start with organizations from characters
    if (initialData?.organizationIds === undefined) {
      // This is a new session - preserve any manually selected organizations
      const currentManuallySelected = Array.from(manuallySelectedOrgsRef.current)
      setSelectedGroups(currentManuallySelected)
    } else {
      // This is editing an existing session - preserve the existing organizationIds
      setSelectedGroups(initialOrgIds)
      
      // Initialize manually selected organizations
      // These are organizations in initial data that don't come from characters
      const orgsFromCharacters = new Set<string>()
      
      initialCharIds.forEach((characterId) => {
        const character = characters.find((c) => c.id === characterId)
        if (character?.organizations) {
          character.organizations.forEach((org) => {
            orgsFromCharacters.add(org.id)
          })
        }
      })
      
      // Mark any initial organizations that aren't from characters as manually selected
      const manuallySelected = new Set<string>()
      initialOrgIds.forEach((orgId) => {
        if (!orgsFromCharacters.has(orgId)) {
          manuallySelected.add(orgId)
        }
      })
      
      manuallySelectedOrgsRef.current = manuallySelected
      
      // Mark existing characters as already synced to prevent re-syncing their orgs
      initialCharIds.forEach((charId) => {
        syncedCharactersRef.current.add(charId)
      })
    }
  }, [initialData?.organizationIds, initialData?.characterIds, characters])

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
            setSelectedCharacterIds((prev) => {
              const next = new Set(prev)
              validIds.forEach((id) => next.add(id))
              return Array.from(next)
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

    setSelectedCharacterIds((prev) => {
      const next = new Set(prev)
      let changed = false
      preselectedCharacterIds.forEach((id) => {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      })
      return changed ? Array.from(next) : prev
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

  const characterOptions: CharacterOption[] = useMemo(() => {
    const sorted = sortCharactersByName(characterList)
    return sorted
      .filter((character): character is Character => Boolean(character?.name))
      .map((character) => ({
        value: character.id,
        label: character.name,
        hint: [character.race, character.class].filter(Boolean).join(' • ') || null,
      }))
  }, [characterList, sortCharactersByName])

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

      if (target.kind === 'character') {
        setSelectedCharacterIds((prev) => {
          if (prev.includes(target.id)) {
            return prev
          }
          return Array.from(new Set([...prev, target.id]))
        })

        setCharacterList((prev) => {
          if (prev.some((character) => character.id === target.id)) {
            return prev
          }
          const next = [...prev, { id: target.id, name: target.name, race: null, class: null }]
          return sortCharactersByName(next)
        })
      } else if (target.kind === 'organization') {
        // Add organization to the list if not already present
        setOrganizationList((prev) => {
          if (prev.some((org) => org.id === target.id)) {
            return prev
        }
        const next = [...prev, { id: target.id, name: target.name }]
        return next.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }))
      })

        // Mark as manually selected
        manuallySelectedOrgsRef.current.add(target.id)
        setSelectedGroups((prev) => {
          if (prev.includes(target.id)) {
            return prev
          }
          return Array.from(new Set([...prev, target.id]))
        })
      }
    },
    [sortCharactersByName]
  )

  const handleCharacterCreated = useCallback(
    (option: CharacterOption) => {
      setCharacterList((prev) => {
        if (prev.some((character) => character.id === option.value)) {
          return prev
        }
        const next = [...prev, { id: option.value, name: option.label, race: null, class: null }]
        return sortCharactersByName(next)
      })

      setSelectedCharacterIds((prev) => Array.from(new Set([...prev, option.value])))

      setMentionableTargets((previous) => {
        if (previous.some((entry) => entry.id === option.value)) {
          return previous
        }
        return [
          ...previous,
          {
            id: option.value,
            name: option.label,
            href: `/characters/${option.value}`,
            kind: 'character' as const,
          },
        ]
      })
    },
    [sortCharactersByName]
  )

  const handleOrganizationCreated = useCallback((option: OrganizationOption) => {
    setOrganizationList((prev) => {
      if (prev.some((organization) => organization.id === option.value)) {
        return prev
      }
      const next = [...prev, { id: option.value, name: option.label }]
      return next.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }))
    })

    // Mark newly created organizations as manually selected
    manuallySelectedOrgsRef.current.add(option.value)
    setSelectedGroups((prev) => {
      if (prev.includes(option.value)) {
        return prev
      }
      return Array.from(new Set([...prev, option.value]))
    })

    setMentionableTargets((previous) => {
      if (previous.some((entry) => entry.id === option.value)) {
        return previous
      }
      return [
        ...previous,
        {
          id: option.value,
          name: option.label,
          href: `/organizations/${option.value}`,
          kind: 'organization' as const,
        },
      ]
    })
  }, [])

  useEffect(() => {
    if (!notesDraft) {
      return
    }

    const characterMentions = collectMentionTargets(notesDraft, mentionableTargets, 'character')

    if (characterMentions.length === 0) {
      return
    }

    setSelectedCharacterIds((prev) => {
      let changed = false
      const next = new Set(prev)
      characterMentions.forEach((target) => {
        if (!next.has(target.id)) {
          next.add(target.id)
          changed = true
        }
      })
      return changed ? Array.from(next) : prev
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

  // One-time auto-sync organizations only when characters are newly added
  useEffect(() => {
    const newlyAddedCharacters = selectedCharacterIds.filter(
      charId => !syncedCharactersRef.current.has(charId)
    )
    
    if (newlyAddedCharacters.length === 0) return
    
    // Get organizations from newly added characters only
    const newOrganizationIds = new Set<string>()
    newlyAddedCharacters.forEach((characterId) => {
      const character = characterList.find((c) => c.id === characterId)
      if (character?.organizations) {
        character.organizations.forEach((org) => {
          newOrganizationIds.add(org.id)
        })
      }
    })
    
    // Mark these characters as synced
    newlyAddedCharacters.forEach(charId => {
      syncedCharactersRef.current.add(charId)
    })
    
    // Add new organizations to selected groups (only if they don't already exist)
    if (newOrganizationIds.size > 0) {
      setSelectedGroups(prev => {
        const combined = new Set([...prev, ...newOrganizationIds])
        return Array.from(combined)
      })
    }
  }, [selectedCharacterIds, characterList])

  // Clean up synced characters when they are removed
  useEffect(() => {
    const currentSet = new Set(selectedCharacterIds)
    const syncedSet = syncedCharactersRef.current
    
    // Remove any characters that are no longer selected
    for (const charId of syncedSet) {
      if (!currentSet.has(charId)) {
        syncedSet.delete(charId)
      }
    }
  }, [selectedCharacterIds])

  // Create a wrapped handler for organization selection changes
  const handleOrganizationSelectionChange = useCallback((newSelectedIds: string[]) => {
    // Calculate which organizations come from characters
    const orgsFromCharacters = new Set<string>()
    selectedCharacterIds.forEach((characterId) => {
      const character = characterList.find((c) => c.id === characterId)
      if (character?.organizations) {
        character.organizations.forEach((org) => {
          orgsFromCharacters.add(org.id)
        })
      }
    })

    const prevSet = new Set(selectedGroups)
    const newSet = new Set(newSelectedIds)

    // Update manually selected organizations
    const manuallySelected = manuallySelectedOrgsRef.current
    
    // Find newly added organizations (not from characters)
    newSet.forEach((orgId) => {
      if (!prevSet.has(orgId) && !orgsFromCharacters.has(orgId)) {
        manuallySelected.add(orgId)
      }
    })
    
    // Find removed organizations that were manually added
    prevSet.forEach((orgId) => {
      if (!newSet.has(orgId) && manuallySelected.has(orgId)) {
        manuallySelected.delete(orgId)
      }
    })

    setSelectedGroups(newSelectedIds)
  }, [selectedCharacterIds, characterList, selectedGroups])

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
            <p className="text-xs font-mono text-[#ff6b35]">{campaignCreationError}</p>
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
      const values = selectedCharacterIds
      if (values.length === 0) {
        window.localStorage.removeItem(charactersStorageKey)
      } else {
        window.localStorage.setItem(charactersStorageKey, JSON.stringify(values))
      }
    })

    return () => {
      cancelDraftUpdate(charactersStorageKey)
    }
  }, [cancelDraftUpdate, charactersStorageKey, scheduleDraftUpdate, selectedCharacterIds])

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
      <div style={{ minHeight: 0, overflow: 'visible', contain: 'layout' }}>
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
          onMentionCreate={handleMentionInsert}
          className="w-full px-4 py-3 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono"
          placeholder="What happened in this session..."
          spellCheck
          data-testid="session-notes-textarea"
        />
        <p className="mt-2 text-xs text-gray-500 font-mono uppercase tracking-wider">
          Use @ to mention characters, sessions, or groups. Mentioned items are linked automatically.
        </p>
      </div>

      {/* Related Characters & Groups */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-bold text-[#00ffff] uppercase tracking-wider">
              Related Characters
            </label>
          </div>
          <CharacterMultiSelect
            id="session-characters"
            name="character_ids"
            options={characterOptions}
            value={selectedCharacterIds}
            onChange={setSelectedCharacterIds}
            placeholder={characterOptions.length ? 'Select characters' : 'No characters available'}
            emptyMessage={characterList.length === 0 ? 'No characters yet. Create one to get started.' : 'No matches found'}
            onCreateOption={handleCharacterCreated}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-bold text-[#00ffff] uppercase tracking-wider">
              Related Groups
            </label>
          </div>
          <OrganizationMultiSelect
            id="session-groups"
            name="organization_ids"
            options={organizationSelectOptions}
            value={selectedGroups}
            onChange={handleOrganizationSelectionChange}
            placeholder={organizationSelectOptions.length ? 'Select groups' : 'No groups available'}
            onCreateOption={handleOrganizationCreated}
          />
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
