"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { createOrganizationInline } from "@/lib/actions/organizations"

type OrganizationOption = {
  value: string
  label: string
}

type OrganizationMultiSelectProps = {
  id: string
  name: string
  value: string[]
  onChange: (next: string[]) => void
  options: readonly OrganizationOption[]
  placeholder?: string
  className?: string
  onCreateOption?: (option: OrganizationOption) => void
}

export default function OrganizationMultiSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select organizations",
  className = "",
  onCreateOption,
}: OrganizationMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [localOptions, setLocalOptions] = useState<OrganizationOption[]>(() => [...options])
  const [creationError, setCreationError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setLocalOptions((current) => {
      const seen = new Set<string>()
      const merged: OrganizationOption[] = []

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
    const map = new Map<string, string>()
    localOptions.forEach((option) => {
      map.set(option.value, option.label)
    })
    return map
  }, [localOptions])

  const normalizedSelections = useMemo(() => {
    return value.filter((selection, index, array) => {
      if (!selection) {
        return false
      }
      return array.indexOf(selection) === index
    })
  }, [value])

  const selectedEntries = useMemo(() => {
    return normalizedSelections.map((selection) => ({
      value: selection,
      label: optionMap.get(selection) ?? "Unknown",
    }))
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
    const term = search.trim().toLowerCase()
    if (!term) {
      return localOptions
    }

    return localOptions.filter((option) => option.label.toLowerCase().includes(term))
  }, [localOptions, search])

  const trimmedSearch = search.trim()

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
    requestAnimationFrame(() => {
      buttonRef.current?.focus()
    })
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

  const handleCreateNewOrganization = useCallback(() => {
    if (!trimmedSearch || !canCreateNew || isPending) {
      return
    }

    setCreationError(null)
    startTransition(() => {
      void createOrganizationInline(trimmedSearch)
        .then((result) => {
          setCreationError(null)
          setLocalOptions((current) => {
            if (current.some((option) => option.value === result.id)) {
              return current
            }
            return [...current, { value: result.id, label: result.name }]
          })

          const createdOption = { value: result.id, label: result.name }
          onCreateOption?.(createdOption)

          const nextSelections = normalizedSelections.includes(result.id)
            ? normalizedSelections
            : [...normalizedSelections, result.id]

          onChange(nextSelections)
          setSearch("")
        })
        .catch((error) => {
          console.error("Failed to create organization", error)
          setCreationError(error instanceof Error ? error.message : "Failed to create organization")
        })
    })
  }, [canCreateNew, isPending, normalizedSelections, onChange, onCreateOption, trimmedSearch])

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
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[#0f0f23] px-4 py-3 font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ffff] ${
          open
            ? "border-[#ff00ff] text-[#ff00ff] shadow-lg shadow-[#ff00ff]/30"
            : normalizedSelections.length > 0
              ? "border-[#00ffff] text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff]"
              : "border-[#00ffff] text-gray-500 hover:border-[#ff00ff] hover:text-[#ff00ff]"
        }`}
      >
        <span className="truncate text-left">{summaryLabel}</span>
        <span className="text-xs text-[#ff00ff]">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div
          id={`${id}-dropdown`}
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-2xl shadow-[#00ffff]/20"
        >
          <div className="border-b border-[#1a1a3e] px-3 py-2">
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
              placeholder="Search organizations"
              className="w-full rounded bg-[#0a0a1f] px-3 py-2 text-sm text-[#00ffff] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff00ff]"
              disabled={isPending}
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              canCreateNew ? null : (
                <p className="px-4 py-6 text-center text-xs font-mono text-gray-500">No organizations found</p>
              )
            ) : (
              <ul className="divide-y divide-[#1a1a3e]">
                {filteredOptions.map((option) => {
                  const checked = normalizedSelections.includes(option.value)
                  return (
                    <li key={option.value}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm text-[#00ffff] transition-colors duration-150 hover:bg-[#1a1a3e]/60">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelection(option.value)}
                          className="h-4 w-4 rounded border-[#00ffff]/40 bg-[#0f0f23] text-[#ff00ff] focus:ring-[#ff00ff]"
                        />
                        <span className="truncate">{option.label}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}

            {canCreateNew ? (
              <div className="border-t border-[#1a1a3e]">
                <button
                  type="button"
                  onClick={handleCreateNewOrganization}
                  disabled={isPending}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#ff00ff] transition-colors duration-150 hover:bg-[#1a1a3e]/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate">Create {trimmedSearch}</span>
                  <span className="text-xs uppercase tracking-wider">New</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#00ffff]/20 bg-[#050517] px-3 py-2 flex flex-col gap-2">
            {creationError ? (
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#ff6ad5]">
                {creationError}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clearSelections}
                className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#00ffff] transition hover:text-[#ff00ff] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyAndClose}
                className="rounded bg-[#ff00ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#cc00cc] disabled:cursor-not-allowed disabled:opacity-60"
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
