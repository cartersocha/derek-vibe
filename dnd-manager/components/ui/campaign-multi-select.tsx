"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { createCampaignInline } from "@/lib/actions/campaigns"

export type CampaignOption = {
  value: string
  label: string
  hint?: string | null
}

type CampaignMultiSelectProps = {
  id: string
  name: string
  value: string[]
  onChange: (next: string[]) => void
  options: readonly CampaignOption[]
  placeholder?: string
  className?: string
  emptyMessage?: string
  onCreateOption?: (option: CampaignOption) => void
}

export default function CampaignMultiSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select campaigns",
  className = "",
  emptyMessage = "No campaigns available",
  onCreateOption,
}: CampaignMultiSelectProps) {
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
        const result = await createCampaignInline(trimmedSearch)
        const createdOption: CampaignOption = {
          value: result.id,
          label: result.name,
        }

        onChange([...normalizedSelections, result.id])
        onCreateOption?.(createdOption)
      } catch (error) {
        console.error("Failed to create campaign:", error)
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

  const handleRemove = useCallback((optionValue: string) => {
    onChange(normalizedSelections.filter((id) => id !== optionValue))
  }, [normalizedSelections, onChange])

  const summaryLabel = useMemo(() => {
    if (normalizedSelections.length === 0) {
      return placeholder
    }

    const selectedLabels = normalizedSelections
      .map(id => options.find(opt => opt.value === id)?.label)
      .filter(Boolean)

    if (selectedLabels.length <= 4) {
      return selectedLabels.join(", ")
    }

    const [first, second, third, fourth] = selectedLabels
    return `${first}, ${second}, ${third}, ${fourth} +${selectedLabels.length - 4}`
  }, [normalizedSelections, options, placeholder])

  return (
    <div ref={containerRef} className={`relative ${className}`} id={id}>
      {/* Sentinel input to indicate this field was provided (even if empty) */}
      <input type="hidden" name={`${name}_field_provided`} value="true" />
      {normalizedSelections.map((selection) => (
        <input key={selection} type="hidden" name={name} value={selection} />
      ))}
      
      <div className="space-y-2">
        {/* Selected items */}
        {normalizedSelections.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {normalizedSelections.map((selection) => {
              const option = options.find((opt) => opt.value === selection)
              if (!option) return null

              return (
                <div
                  key={selection}
                  className="flex items-center gap-2 px-3 py-1 bg-[var(--cyber-cyan)] bg-opacity-10 border border-[var(--cyber-cyan)] border-opacity-30 rounded text-[var(--cyber-cyan)] text-sm"
                >
                  <span className="font-mono">{option.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(selection)}
                    className="text-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)] font-bold"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Dropdown trigger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full px-4 py-3 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 text-[var(--cyber-cyan)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] focus:border-transparent font-mono text-left"
        >
          <span>{summaryLabel}</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 rounded shadow-lg">
            <div className="p-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full px-3 py-2 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 text-[var(--cyber-cyan)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] focus:border-transparent font-mono text-sm"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 && !canCreateNew ? (
                <div className="px-4 py-3 text-[var(--text-muted)] text-sm font-mono">
                  {emptyMessage}
                </div>
              ) : (
                <>
                  {filteredOptions.map((option) => {
                    const isSelected = normalizedSelections.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleToggle(option.value)}
                        className={`w-full px-4 py-2 text-left hover:bg-[var(--orange-400)] hover:bg-opacity-10 font-mono text-sm ${
                          isSelected ? "bg-[var(--orange-400)] bg-opacity-20 text-[var(--orange-400)]" : "text-[var(--orange-400)]"
                        }`}
                      >
                        {option.label}
                        {option.hint && (
                          <span className="ml-2 text-[var(--gray-400)] text-xs">
                            {option.hint}
                          </span>
                        )}
                      </button>
                    )
                  })}

                  {canCreateNew && (
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      disabled={isPending}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--orange-400)] hover:bg-opacity-10 text-[var(--orange-400)] font-mono text-sm border-t border-[var(--orange-400)] border-opacity-30"
                    >
                      {isPending ? "Creating..." : `+ Create "${trimmedSearch}"`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
