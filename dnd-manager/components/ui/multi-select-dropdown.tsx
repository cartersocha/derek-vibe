"use client"

import { useEffect, useRef, useState, startTransition } from "react"
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
  const [selected, setSelected] = useState(() =>
    new Set(options.filter((option) => option.checked).map((option) => option.id))
  )
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelected(new Set(options.filter((option) => option.checked).map((option) => option.id)))
  }, [options])

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

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const toggleOption = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSubmit = () => {
    setLoading(true)
    startTransition(() => {
      onSubmit(Array.from(selected))
        .then(() => {
          router.refresh()
          setOpen(false)
        })
        .catch((error) => {
          console.error("Failed to update selections", error)
        })
        .finally(() => {
          setLoading(false)
        })
    })
  }

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
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={loading}
        className={`flex w-full items-center justify-between gap-3 rounded border border-opacity-30 bg-[#0f0f23] px-4 py-2 text-left font-mono text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00ffff] disabled:cursor-not-allowed disabled:opacity-60 ${
          open
            ? 'border-[#ff00ff] text-[#ff00ff] shadow-lg shadow-[#ff00ff]/30'
            : 'border-[#00ffff] text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff]'
        }`}
      >
  <span>{selectionSummary}</span>
        <span className="text-xs text-[#ff00ff]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className={`absolute right-0 z-20 mt-2 overflow-hidden rounded border border-[#00ffff] border-opacity-30 bg-[#0f0f23] shadow-2xl shadow-[#00ffff]/20 ${menuWidth}`}>
          <div className="max-h-64 overflow-y-auto">
            {options.length > 0 ? (
              <ul className="divide-y divide-[#1a1a3e]">
                {options.map((option) => (
                  <li key={option.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#1a1a3e]/50">
                      <input
                        type="checkbox"
                        checked={selected.has(option.id)}
                        onChange={() => toggleOption(option.id)}
                        disabled={loading}
                        className="rounded border-[#00ffff] border-opacity-30 text-[#ff00ff] focus:ring-[#ff00ff] bg-[#0f0f23] disabled:opacity-60"
                      />
                      <span className="flex flex-1 flex-col">
                        <span className="text-[#00ffff] text-sm">{option.label}</span>
                        {option.subLabel && (
                          <span className="text-xs text-gray-500 uppercase tracking-wider">{option.subLabel}</span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-xs font-mono text-gray-500">{emptyMessage}</p>
            )}
          </div>

          <div className="border-t border-[#00ffff] border-opacity-20 bg-[#0f0f23] p-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#00ffff] hover:text-[#ff00ff]"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded bg-[#ff00ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#cc00cc] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Saving…" : submitLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
