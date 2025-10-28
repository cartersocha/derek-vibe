'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import ConfirmDialog from './confirm-dialog'
import TrashIcon from './trash-icon'

export function DeleteCharacterButton() {
  const { pending } = useFormStatus()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!open) {
      e.preventDefault()
      setOpen(true)
    }
  }

  const handleConfirm = () => {
    setOpen(false)
    const form = buttonRef.current?.form
    if (form) {
      if (form.requestSubmit) {
        form.requestSubmit(buttonRef.current as HTMLButtonElement)
      } else {
        form.submit()
      }
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="submit"
        disabled={pending}
        onClick={handleClick}
        className="inline-flex w-auto h-10 bg-[var(--bg-dark)] border border-[var(--red-500)] border-opacity-50 text-[var(--red-500)] px-4 text-sm sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[var(--red-500)] hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center"
      >
        <TrashIcon size="sm" className="bg-[var(--red-500)] hover:bg-black" />
      </button>
      <ConfirmDialog
        open={open}
        title="Delete character?"
        description="You sure about that?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  )
}
