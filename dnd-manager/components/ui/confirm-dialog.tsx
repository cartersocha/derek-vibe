'use client'

import { useEffect, useRef } from 'react'
import TrashIcon from './trash-icon'

type ConfirmDialogProps = {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const firstButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const to = setTimeout(() => firstButtonRef.current?.focus(), 0)
    return () => {
      clearTimeout(to)
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? 'confirm-dialog-description' : undefined}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative w-[92vw] max-w-sm sm:max-w-md bg-[var(--bg-card)] border border-[var(--cyber-magenta)]/40 rounded shadow-xl text-[var(--text-primary)]"
      >
        <div className="px-5 py-4 border-b border-[var(--cyber-magenta)]/30">
          <h2 id="confirm-dialog-title" className="text-base sm:text-lg font-bold tracking-wider uppercase text-[var(--cyber-cyan)]">
            {title}
          </h2>
        </div>
        {description ? (
          <div className="px-5 py-4 text-sm sm:text-base text-[var(--text-secondary)]">
            <p id="confirm-dialog-description">{description}</p>
          </div>
        ) : null}
        <div className="px-5 py-4 flex gap-3 justify-end">
          <button
            ref={firstButtonRef}
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center text-center h-10 px-4 rounded border border-[var(--cyber-cyan)] text-[var(--cyber-cyan)] tracking-wider uppercase text-sm sm:text-base hover:bg-[var(--cyber-cyan)] hover:text-black transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            title={confirmLabel}
            aria-label={confirmLabel}
            className={
              confirmVariant === 'danger'
                ? 'inline-flex items-center justify-center h-10 w-12 rounded border border-[var(--cyber-magenta)] text-black bg-[var(--cyber-magenta)] tracking-wider uppercase font-bold text-sm sm:text-base hover:brightness-110 transition-colors'
                : 'inline-flex items-center justify-center h-10 px-4 rounded border border-[var(--cyber-cyan)] text-black bg-[var(--cyber-cyan)] tracking-wider uppercase font-bold text-sm sm:text-base hover:brightness-110 transition-colors'
            }
          >
            {confirmVariant === 'danger' ? (
              <TrashIcon size="sm" className="bg-black" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


