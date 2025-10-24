'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export interface SynthwaveDropdownOption {
  value: string
  label: string
}

interface SynthwaveDropdownProps {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  options: readonly SynthwaveDropdownOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  hideSearch?: boolean
  customFooter?: ReactNode
  colorVariant?: 'default' | 'campaign'
}

export default function SynthwaveDropdown({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  hideSearch = false,
  customFooter,
  colorVariant = 'default',
}: SynthwaveDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const getColors = () => {
    if (colorVariant === 'campaign') {
      return {
        primary: 'var(--cyber-magenta)',
        hover: 'var(--cyber-magenta)',
        focus: 'var(--cyber-magenta)',
        shadow: 'var(--cyber-magenta)'
      }
    }
    return {
      primary: 'var(--cyber-cyan)',
      hover: 'var(--cyber-magenta)',
      focus: 'var(--cyber-cyan)',
      shadow: 'var(--cyber-magenta)'
    }
  }

  const colors = getColors()

  const selectedLabel = useMemo(() => {
    const match = options.find((option) => option.value === value)
    return match?.label ?? ''
  }, [options, value])

  const filteredOptions = useMemo(() => {
    if (hideSearch) {
      return options
    }

    const term = search.trim().toLowerCase()
    if (!term) {
      return options
    }

    return options.filter((option) => option.label.toLowerCase().includes(term))
  }, [hideSearch, options, search])

  const closeMenu = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  const handleSelect = useCallback(
    (option: SynthwaveDropdownOption) => {
      onChange(option.value)
      closeMenu()
      requestAnimationFrame(() => {
        buttonRef.current?.focus()
      })
    },
    [closeMenu, onChange]
  )

  const handleDocumentClick = useCallback((event: MouseEvent) => {
    if (!containerRef.current?.contains(event.target as Node)) {
      closeMenu()
    }
  }, [closeMenu])

  const handleDocumentKeydown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeMenu()
      buttonRef.current?.focus()
    }
  }, [closeMenu])

  const toggleMenu = useCallback(() => {
    if (disabled) {
      return
    }
    setOpen((prev) => {
      const next = !prev
      if (!next) {
        setSearch('')
      }
      return next
    })
  }, [disabled])

  useEffect(() => {
    if (!open) {
      return
    }

    document.addEventListener('mousedown', handleDocumentClick)
    document.addEventListener('keydown', handleDocumentKeydown)
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('keydown', handleDocumentKeydown)
    }
  }, [handleDocumentClick, handleDocumentKeydown, open])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input type="hidden" id={id} name={name} value={value} />
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-dropdown`}
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[var(--bg-dark)] px-4 py-3 font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[${colors.focus}] ${
          open
            ? `border-[${colors.hover}] text-[${colors.hover}] shadow-lg shadow-[${colors.shadow}]/30`
            : value
              ? `border-[${colors.primary}] text-[${colors.primary}] hover:border-[${colors.hover}] hover:text-[${colors.hover}]`
              : `border-[${colors.primary}] text-[var(--text-muted)] hover:border-[${colors.hover}] hover:text-[${colors.hover}]`
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <span className={`text-xs text-[${colors.hover}]`}>{open ? '▲' : '▼'}</span>
      </button>

      {open ? (
        <div
          id={`${id}-dropdown`}
          role="listbox"
          className={`absolute z-20 mt-2 w-full overflow-hidden rounded border border-[${colors.primary}] border-opacity-30 bg-[var(--bg-dark)] shadow-2xl shadow-[${colors.shadow}]/20`}
        >
          {!hideSearch ? (
            <div className="border-b border-[var(--bg-card)] px-3 py-2">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className={`w-full rounded bg-[var(--bg-dark)] px-3 py-2 text-sm text-[${colors.primary}] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[${colors.hover}]`}
              />
            </div>
          ) : null}

          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs font-mono text-[var(--text-muted)]">No options available</p>
            ) : (
              <ul className="divide-y divide-[var(--bg-card)]">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelect(option)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-[var(--bg-card)]/60 ${
                          isSelected ? `text-[${colors.hover}]` : `text-[${colors.primary}]`
                        }`}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected ? <span className="text-xs uppercase tracking-wider">Selected</span> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {customFooter ? (
            <div className="border-t border-[var(--bg-card)] bg-[var(--bg-dark)] px-3 py-2">
              {customFooter}
            </div>
          ) : null}

        </div>
      ) : null}
    </div>
  )
}
