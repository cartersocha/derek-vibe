"use client"

import { useCallback, useEffect, useRef, useState, startTransition } from "react"
import { useRouter } from "next/navigation"

type Option = {
  id: string
  label: string
  subLabel?: string | null
  checked: boolean
}

type MultiSelectDropdownProps = {
  label: string
  options: Option[]
  onSubmit: (selectedIds: string[]) => Promise<void>
  emptyMessage?: string
  submitLabel?: string
  className?: string
  menuWidthClass?: string
}

export default function MultiSelectDropdown({
  label,
  options,
  onSubmit,
  emptyMessage = "No items available",
  submitLabel = "Save",
  className,
  menuWidthClass,
}: MultiSelectDropdownProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(() =>
    new Set(options.filter((option) => option.checked).map((option) => option.id))
  )
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setSelected(new Set(options.filter((option) => option.checked).map((option) => option.id)))
  }, [options])

  const filteredOptions = options.filter((option) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return option.label.toLowerCase().includes(term)
  })

  const closeMenu = useCallback(() => {
    setOpen(false)
    setSearch("")
    requestAnimationFrame(() => {
      buttonRef.current?.focus()
    })
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
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

  const toggleOption = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleMenu = useCallback(() => {
    if (open) {
      closeMenu()
      return
    }
    setSearch("")
    setOpen(true)
  }, [closeMenu, open])

  const handleSubmit = useCallback(() => {
    setLoading(true)
    startTransition(() => {
      onSubmit(Array.from(selected))
        .then(() => {
          router.refresh()
          closeMenu()
        })
        .catch((error) => {
          console.error("Failed to update selections", error)
        })
        .finally(() => {
          setLoading(false)
        })
    })
  }, [selected, onSubmit, router, closeMenu])

  const clearSelections = useCallback(() => {
    if (loading) return
    setSelected(new Set())
  }, [loading])

  const selectionSummary = (() => {
    const count = selected.size
    if (count === 0) return label
    if (count === options.length) return `${label} • All`
    return `${label}`
  })()

  const menuWidth = menuWidthClass ?? "w-72"

  return (
    <div className={`relative ${className ?? ''}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${label.toLowerCase().replace(/\s+/g, '-')}-dropdown`}
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[var(--bg-dark)] px-4 py-3 font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] disabled:cursor-not-allowed disabled:opacity-60 ${
          open
            ? "border-[var(--cyber-magenta)] text-[var(--cyber-magenta)] shadow-lg shadow-[var(--cyber-magenta)]/30"
            : selected.size > 0
              ? "border-[var(--cyber-cyan)] text-[var(--cyber-cyan)] hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)]"
              : "border-[var(--cyber-cyan)] text-[var(--text-muted)] hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)]"
        }`}
      >
        <span className="truncate text-left">{selectionSummary}</span>
        <span className="text-xs text-[var(--cyber-magenta)]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          id={`${label.toLowerCase().replace(/\s+/g, '-')}-dropdown`}
          role="listbox"
          className={`absolute z-20 mt-2 w-full overflow-hidden rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-[var(--bg-dark)] shadow-2xl shadow-[var(--cyber-cyan)]/20 ${menuWidth} max-w-[calc(100vw-2rem)] sm:max-w-none`}
        >
          <div className="border-b border-[var(--bg-card)] px-3 py-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sessions"
              className="w-full rounded bg-[var(--bg-dark)] px-3 py-2 text-sm text-[var(--cyber-cyan)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)]"
              disabled={loading}
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs font-mono text-[var(--text-muted)]">{emptyMessage}</p>
            ) : (
              <ul className="divide-y divide-[var(--bg-card)]">
                {filteredOptions.map((option) => {
                  const checked = selected.has(option.id)
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => toggleOption(option.id)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-[var(--bg-card)]/60 ${
                          checked ? 'text-[var(--cyber-magenta)]' : 'text-[var(--cyber-cyan)]'
                        }`}
                      >
                        <span className="truncate">
                          {checked ? "✓ " : ""}{option.label}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-[var(--cyber-cyan)]/20 bg-[var(--bg-dark)] px-3 py-2 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clearSelections}
                className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--cyber-cyan)] transition hover:text-[var(--cyber-magenta)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded bg-[var(--cyber-magenta)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[var(--cyber-magenta)]/80 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Working…" : submitLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
