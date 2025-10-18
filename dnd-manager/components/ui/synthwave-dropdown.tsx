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
}: SynthwaveDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[#0f0f23] px-4 py-3 font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ffff] ${
          open
            ? 'border-[#ff00ff] text-[#ff00ff] shadow-lg shadow-[#ff00ff]/30'
            : value
              ? 'border-[#00ffff] text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff]'
              : 'border-[#00ffff] text-gray-500 hover:border-[#ff00ff] hover:text-[#ff00ff]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <span className="text-xs text-[#ff00ff]">{open ? '▲' : '▼'}</span>
      </button>

      {open ? (
        <div
          id={`${id}-dropdown`}
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-2xl shadow-[#00ffff]/20"
        >
          {!hideSearch ? (
            <div className="border-b border-[#1a1a3e] px-3 py-2">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="w-full rounded bg-[#0a0a1f] px-3 py-2 text-sm text-[#00ffff] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff00ff]"
              />
            </div>
          ) : null}

          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs font-mono text-gray-500">No options available</p>
            ) : (
              <ul className="divide-y divide-[#1a1a3e]">
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
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-[#1a1a3e]/60 ${
                          isSelected ? 'text-[#ff00ff]' : 'text-[#00ffff]'
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
            <div className="border-t border-[#1a1a3e] bg-[#0a0a1f] px-3 py-2">
              {customFooter}
            </div>
          ) : null}

        </div>
      ) : null}
    </div>
  )
}
