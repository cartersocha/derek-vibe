
'use client'

import type { MouseEvent } from 'react'
import { useFormStatus } from 'react-dom'

export function DeleteOrganizationButton() {
  const { pending } = useFormStatus()

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!confirm('Delete this organization? Linked campaigns, sessions, and characters will remain, but their affiliations will be removed.')) {
      event.preventDefault()
    }
  }

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={handleClick}
      className="w-full sm:w-auto bg-[var(--bg-dark)] border border-red-500 border-opacity-50 text-red-500 px-4 py-2 text-sm sm:text-base rounded font-bold uppercase tracking-wider hover:bg-red-500 hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
