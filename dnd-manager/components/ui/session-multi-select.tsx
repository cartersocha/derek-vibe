"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { createSessionInline } from "@/lib/actions/sessions"
import { sanitizeSearchQuery } from "@/lib/security/sanitize"

export type SessionOption = {
  value: string
  label: string
  hint?: string | null
}

type SessionMultiSelectProps = {
  id: string
  name: string
  value: string[]
  onChange: (next: string[]) => void
  options: readonly SessionOption[]
  placeholder?: string
  className?: string
  emptyMessage?: string
  onCreateOption?: (option: SessionOption) => void
  campaignId?: string | null
}

export default function SessionMultiSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select sessions",
  className = "",
  emptyMessage = "No sessions found",
  onCreateOption,
  campaignId = null,
}: SessionMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [localOptions, setLocalOptions] = useState<SessionOption[]>(() => [...options])
  const [creationError, setCreationError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setLocalOptions((current) => {
      const seen = new Set<string>()
      const merged: SessionOption[] = []

      options.forEach((option) => {
        if (!seen.has(option.value)) {
          seen.add(option.value)
          merged.push(option)
        }
      })

      current.forEach((option) => {
        if (!seen.has(option.value)) {
          seen.add(option.value)
          merged.push(option)
        }
      })

      return merged
    })
  }, [options])

  const optionMap = useMemo(() => {
    const map = new Map<string, SessionOption>()
    localOptions.forEach((option) => {
      map.set(option.value, option)
    })
    return map
  }, [localOptions])

  const normalizedSelections = useMemo(() => {
    return value.filter((selection, index, array) => selection && array.indexOf(selection) === index)
  }, [value])

  const selectedEntries = useMemo(() => {
    return normalizedSelections.map((selection) => optionMap.get(selection) ?? { value: selection, label: "Unknown" })
  }, [normalizedSelections, optionMap])

  const summaryLabel = useMemo(() => {
    if (selectedEntries.length === 0) {
      return placeholder
    }

    if (selectedEntries.length <= 2) {
      return selectedEntries.map((entry) => entry.label).join(", ")
    }

    const [first, second] = selectedEntries
    return `${first.label}, ${second.label} +${selectedEntries.length - 2}`
  }, [placeholder, selectedEntries])

  const filteredOptions = useMemo(() => {
    const sanitizedSearch = sanitizeSearchQuery(search)
    const term = sanitizedSearch.trim().toLowerCase()
    if (!term) {
      return localOptions
    }

    return localOptions.filter((option) => option.label.toLowerCase().includes(term))
  }, [localOptions, search])

  const trimmedSearch = sanitizeSearchQuery(search).trim()

  const canCreateNew = useMemo(() => {
    if (!trimmedSearch) {
      return false
    }

    return !localOptions.some((option) => option.label.toLowerCase() === trimmedSearch.toLowerCase())
  }, [localOptions, trimmedSearch])

  const closeMenu = useCallback(() => {
    setOpen(false)
    setSearch("")
    setCreationError(null)
    requestAnimationFrame(() => buttonRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return
      }
      if (!containerRef.current.contains(event.target as Node)) {
        closeMenu()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [closeMenu, open])

  const toggleMenu = useCallback(() => {
    if (open) {
      closeMenu()
      return
    }

    setCreationError(null)
    setSearch("")
    setOpen(true)
  }, [closeMenu, open])

  const toggleSelection = useCallback(
    (selection: string) => {
      if (!selection) {
        return
      }

      if (normalizedSelections.includes(selection)) {
        onChange(normalizedSelections.filter((entry) => entry !== selection))
        return
      }

      onChange([...normalizedSelections, selection])
    },
    [normalizedSelections, onChange]
  )

  const handleCreateNewSession = useCallback(() => {
    if (!trimmedSearch || !canCreateNew || isPending) {
      return
    }

    setCreationError(null)
    startTransition(() => {
      void createSessionInline(trimmedSearch, { campaignId: campaignId ?? undefined })
        .then((result) => {
          const createdOption: SessionOption = { value: result.id, label: result.name }

          setLocalOptions((current) => {
            if (current.some((option) => option.value === result.id)) {
              return current
            }
            return [...current, createdOption]
          })

          onCreateOption?.(createdOption)

          const nextSelections = normalizedSelections.includes(result.id)
            ? normalizedSelections
            : [...normalizedSelections, result.id]

          onChange(nextSelections)
          setSearch("")
        })
        .catch((error) => {
          console.error("Failed to create session", error)
          setCreationError(error instanceof Error ? error.message : "Failed to create session")
        })
    })
  }, [campaignId, canCreateNew, isPending, normalizedSelections, onChange, onCreateOption, trimmedSearch])

  const clearSelections = useCallback(() => {
    if (isPending) {
      return
    }
    onChange([])
    closeMenu()
  }, [closeMenu, isPending, onChange])

  const applyAndClose = useCallback(() => {
    if (isPending) {
      return
    }
    closeMenu()
  }, [closeMenu, isPending])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Sentinel input to indicate this field was provided (even if empty) */}
      <input type="hidden" name={`${name}_field_provided`} value="true" />
      {normalizedSelections.map((selection) => (
        <input key={selection} type="hidden" name={name} value={selection} />
      ))}

      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-dropdown`}
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[var(--bg-dark)] px-4 py-3 font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] ${
          open
            ? "border-[var(--cyber-magenta)] text-[var(--cyber-magenta)] shadow-lg shadow-[var(--cyber-magenta)]/30"
            : normalizedSelections.length > 0
              ? "border-[var(--cyber-cyan)] text-[var(--cyber-cyan)] hover-cyber"
              : "border-[var(--cyber-cyan)] text-[var(--text-muted)] hover-cyber"
        }`}
      >
        <span className="truncate text-left">{summaryLabel}</span>
        <span className="text-xs text-[var(--cyber-magenta)]">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div
          id={`${id}-dropdown`}
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-[var(--bg-dark)] shadow-2xl shadow-[var(--cyber-cyan)]/20"
        >
          <div className="border-b border-[var(--bg-card)] px-3 py-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(event) => {
                if (creationError) {
                  setCreationError(null)
                }
                setSearch(event.target.value)
              }}
              placeholder="Search sessions"
              className="w-full rounded bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--cyber-cyan)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)]"
              disabled={isPending}
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              canCreateNew ? null : (
                <p className="px-4 py-6 text-center text-xs font-mono text-[var(--gray-500)]">{emptyMessage}</p>
              )
            ) : (
              <ul className="divide-y divide-[var(--bg-card)]">
                {filteredOptions.map((option) => {
                  const checked = normalizedSelections.includes(option.value)
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => toggleSelection(option.value)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-[var(--bg-card)]/60 ${
                          checked ? 'text-[var(--cyber-magenta)]' : 'text-[var(--cyber-cyan)]'
                        }`}
                      >
                        <span className="truncate">
                          {checked ? "✓ " : ""}{option.label}
                          {option.hint && (
                            <span className="ml-2 text-[var(--gray-400)] text-xs">
                              {option.hint}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {canCreateNew ? (
              <div className="border-t border-[var(--bg-card)]">
                <button
                  type="button"
                  onClick={handleCreateNewSession}
                  disabled={isPending}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[var(--cyber-magenta)] transition-colors duration-150 hover:bg-[var(--bg-card)]/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate">Create {trimmedSearch}</span>
                  <span className="text-xs uppercase tracking-wider">New Session</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--cyber-cyan)]/20 bg-[var(--bg-dark)] px-3 py-2 flex flex-col gap-2">
            {creationError ? (
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--cyber-magenta)]">
                {creationError}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clearSelections}
                className="rounded px-[var(--pill-padding-x-medium)] py-[var(--pill-padding-y-medium)] text-xs font-bold uppercase tracking-wider text-[var(--cyber-cyan)] transition hover:text-[var(--cyber-magenta)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyAndClose}
                className="rounded bg-[var(--cyber-magenta)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[var(--cyber-magenta)]/80 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
              >
                {isPending ? "Working…" : "Done"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
