'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sanitizeSearchQuery } from '@/lib/security/sanitize'

interface CreatableSelectProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  storageKey?: string
  normalizeOption?: (value: string) => string
  label?: string
  allowClear?: boolean
}

const STORAGE_PREFIX = 'creatable-select:'

export default function CreatableSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  storageKey,
  normalizeOption,
  label,
  allowClear = true,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [customOptions, setCustomOptions] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const normalize = useCallback(
    (input: string) => {
      const trimmed = input.trim()
      if (!trimmed) {
        return ''
      }
      return normalizeOption ? normalizeOption(trimmed) : trimmed
    },
    [normalizeOption]
  )

  const storageKeyWithPrefix = useMemo(() => {
    if (!storageKey) {
      return null
    }
    return `${STORAGE_PREFIX}${storageKey}`
  }, [storageKey])

  useEffect(() => {
    if (!storageKeyWithPrefix) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }

    try {
      const stored = window.localStorage.getItem(storageKeyWithPrefix)
      if (!stored) {
        return
      }
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) {
        return
      }
      const sanitized = parsed
        .map((entry) => (typeof entry === 'string' ? normalize(entry) : ''))
        .filter((entry): entry is string => Boolean(entry))
      if (sanitized.length > 0) {
        setCustomOptions((current) => {
          const existingLower = new Set(current.map((option) => option.toLowerCase()))
          const next = [...current]
          sanitized.forEach((entry) => {
            const key = entry.toLowerCase()
            if (!existingLower.has(key)) {
              existingLower.add(key)
              next.push(entry)
            }
          })
          return next
        })
      }
    } catch (error) {
      console.error('Failed to restore saved options', error)
    }
  }, [normalize, storageKeyWithPrefix])

  useEffect(() => {
    if (!storageKeyWithPrefix) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }

    const serialized = JSON.stringify(customOptions)
    window.localStorage.setItem(storageKeyWithPrefix, serialized)
  }, [customOptions, storageKeyWithPrefix])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setSearch('')
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const combinedOptions = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []

    options.forEach((option) => {
      const normalized = normalize(option)
      if (!normalized) {
        return
      }
      const key = normalized.toLowerCase()
      if (seen.has(key)) {
        return
      }
      seen.add(key)
      ordered.push(normalized)
    })

    customOptions
      .slice()
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .forEach((option) => {
        const normalized = normalize(option)
        if (!normalized) {
          return
        }
        const key = normalized.toLowerCase()
        if (seen.has(key)) {
          return
        }
        seen.add(key)
        ordered.push(normalized)
      })

    const currentValue = normalize(value)
    if (currentValue && !seen.has(currentValue.toLowerCase())) {
      ordered.push(currentValue)
    }

    return ordered
  }, [customOptions, normalize, options, value])

  const filteredOptions = useMemo(() => {
    const sanitizedSearch = sanitizeSearchQuery(search)
    const query = sanitizedSearch.trim().toLowerCase()
    if (!query) {
      return combinedOptions
    }
    return combinedOptions.filter((option) => option.toLowerCase().includes(query))
  }, [combinedOptions, search])

  const normalizedSearchValue = useMemo(() => normalize(search), [normalize, search])

  const canCreate = useMemo(() => {
    if (!normalizedSearchValue) {
      return false
    }
    return !combinedOptions.some((option) => option.toLowerCase() === normalizedSearchValue.toLowerCase())
  }, [combinedOptions, normalizedSearchValue])

  const handleSelect = useCallback(
    (option: string) => {
      onChange(normalize(option))
      setOpen(false)
      setSearch('')
      requestAnimationFrame(() => {
        buttonRef.current?.focus()
      })
    },
    [normalize, onChange]
  )

  const handleCreate = useCallback(() => {
    if (!canCreate || !normalizedSearchValue) {
      return
    }

    setCustomOptions((previous) => {
      const key = normalizedSearchValue.toLowerCase()
      if (previous.some((option) => option.toLowerCase() === key)) {
        return previous
      }
      return [...previous, normalizedSearchValue]
    })

    handleSelect(normalizedSearchValue)
  }, [canCreate, handleSelect, normalizedSearchValue])

  const handleClear = useCallback(() => {
    onChange('')
    setOpen(false)
    setSearch('')
    requestAnimationFrame(() => {
      buttonRef.current?.focus()
    })
  }, [onChange])

  const toggleDropdown = useCallback(() => {
    setOpen((previous) => {
      const next = !previous
      if (next) {
        setSearch('')
      }
      return next
    })
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {label ? (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      ) : null}
      <input type="hidden" id={id} name={name} value={value} />
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[#0f0f23] px-4 py-3 font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ffff] ${
          open
            ? 'border-[#ff00ff] text-[#ff00ff] shadow-lg shadow-[#ff00ff]/30'
            : value
              ? 'border-[#00ffff] text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff]'
              : 'border-[#00ffff] text-gray-500 hover:border-[#ff00ff] hover:text-[#ff00ff]'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-dropdown`}
      >
        <span className="truncate">{value || placeholder}</span>
        <span className="text-xs text-[#ff00ff]">{open ? '▲' : '▼'}</span>
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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search or create"
              className="w-full rounded bg-[#0a0a1f] px-3 py-2 text-sm text-[#00ffff] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff00ff]"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 && !canCreate ? (
              <p className="px-4 py-6 text-center text-xs font-mono text-gray-500">No matches</p>
            ) : (
              <ul className="divide-y divide-[#1a1a3e]">
                {filteredOptions.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-[#1a1a3e]/60 ${
                        value.toLowerCase() === option.toLowerCase() ? 'text-[#ff00ff]' : 'text-[#00ffff]'
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      <span className="truncate">{option}</span>
                      {value.toLowerCase() === option.toLowerCase() ? <span className="text-xs">Selected</span> : null}
                    </button>
                  </li>
                ))}
                {canCreate ? (
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#ff00ff] transition-colors duration-150 hover:bg-[#1a1a3e]/60"
                      onClick={handleCreate}
                    >
                      <span className="truncate">Create &quot;{normalizedSearchValue}&quot;</span>
                      <span className="text-xs uppercase tracking-wider">New</span>
                    </button>
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#00ffff] border-opacity-20 bg-[#0f0f23] px-3 py-2">
            <button
              type="button"
              className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#00ffff] hover:text-[#ff00ff]"
              onClick={() => {
                setOpen(false)
                setSearch('')
              }}
            >
              Close
            </button>
            {allowClear ? (
              <button
                type="button"
                className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff00ff] hover:text-[#cc00cc]"
                onClick={handleClear}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
