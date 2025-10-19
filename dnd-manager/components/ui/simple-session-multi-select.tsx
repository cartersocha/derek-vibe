"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { createSessionInline } from "@/lib/actions/sessions"

export type SessionOption = {
  value: string
  label: string
  hint?: string | null
}

type SimpleSessionMultiSelectProps = {
  id: string
  name: string
  value: string[]
  onChange: (next: string[]) => void
  options: readonly SessionOption[]
  placeholder?: string
  className?: string
  emptyMessage?: string
  onCreateOption?: (option: SessionOption) => void
}

export default function SimpleSessionMultiSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select sessions",
  className = "",
  emptyMessage = "No sessions available",
  onCreateOption,
}: SimpleSessionMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()

  const normalizedSelections = useMemo(() => {
    return value.filter(Boolean)
  }, [value])

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options
    }

    const normalizedSearch = searchTerm.toLowerCase().trim()
    return options.filter((option) => {
      const normalizedLabel = option.label.toLowerCase()
      return normalizedLabel.includes(normalizedSearch)
    })
  }, [options, searchTerm])

  const trimmedSearch = searchTerm.trim()
  const canCreateNew = Boolean(trimmedSearch && !filteredOptions.some((option) => option.label.toLowerCase() === trimmedSearch.toLowerCase()))

  const handleCreateNew = useCallback(async () => {
    if (!canCreateNew || isPending) {
      return
    }

    startTransition(async () => {
      try {
        const result = await createSessionInline(trimmedSearch)
        const createdOption: SessionOption = {
          value: result.id,
          label: result.name,
        }

        onChange([...normalizedSelections, result.id])
        onCreateOption?.(createdOption)
      } catch (error) {
        console.error("Failed to create session:", error)
      }
    })
  }, [canCreateNew, isPending, normalizedSelections, onChange, onCreateOption, trimmedSearch])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const handleToggle = useCallback((optionValue: string) => {
    const isSelected = normalizedSelections.includes(optionValue)
    if (isSelected) {
      onChange(normalizedSelections.filter((id) => id !== optionValue))
    } else {
      onChange([...normalizedSelections, optionValue])
    }
  }, [normalizedSelections, onChange])

  const selectedLabels = useMemo(() => {
    return normalizedSelections
      .map(id => options.find(opt => opt.value === id)?.label)
      .filter(Boolean)
      .join(", ")
  }, [normalizedSelections, options])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Sentinel input to indicate this field was provided (even if empty) */}
      <input type="hidden" name={`${name}_field_provided`} value="true" />
      {normalizedSelections.map((selection) => (
        <input key={selection} type="hidden" name={name} value={selection} />
      ))}
      
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[#0f0f23] px-4 py-3 font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ffff] ${
          open
            ? 'border-[#ff00ff] text-[#ff00ff] shadow-lg shadow-[#ff00ff]/30'
            : normalizedSelections.length > 0
              ? 'border-[#00ffff] text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff]'
              : 'border-[#00ffff] text-gray-500 hover:border-[#ff00ff] hover:text-[#ff00ff]'
        }`}
      >
        <span className="truncate">{selectedLabels || placeholder}</span>
        <span className="text-xs uppercase tracking-wider">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 rounded shadow-lg">
          <div className="p-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sessions..."
              className="w-full px-3 py-2 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent font-mono text-sm"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 && !canCreateNew ? (
              <div className="px-4 py-3 text-gray-500 text-sm font-mono">
                {emptyMessage}
              </div>
            ) : (
              <ul className="divide-y divide-[#1a1a3e]">
                {filteredOptions.map((option) => {
                  const isSelected = normalizedSelections.includes(option.value)
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => handleToggle(option.value)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-[#1a1a3e]/60 ${
                          isSelected ? 'text-[#ff00ff]' : 'text-[#00ffff]'
                        }`}
                      >
                        <span className="truncate">
                          {isSelected ? "✓ " : ""}{option.label}
                          {option.hint && (
                            <span className="ml-2 text-gray-400 text-xs">
                              {option.hint}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}

                {canCreateNew && (
                  <li>
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      disabled={isPending}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#ff00ff] transition-colors duration-150 hover:bg-[#1a1a3e]/60"
                    >
                      <span className="truncate">
                        {isPending ? "Creating..." : `Create "${trimmedSearch}"`}
                      </span>
                      <span className="text-xs uppercase tracking-wider">New</span>
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#00ffff] border-opacity-20 bg-[#0f0f23] px-3 py-2">
            <button
              type="button"
              className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#00ffff] hover:text-[#ff00ff]"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
