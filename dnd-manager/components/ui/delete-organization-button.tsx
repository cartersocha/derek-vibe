
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
      className="inline-flex items-center justify-center rounded border border-red-500 border-opacity-50 bg-[#0f0f23] px-4 py-2 text-sm font-bold uppercase tracking-[0.35em] text-red-500 transition hover:bg-red-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Deleting…' : 'Delete Organization'}
    </button>
  )
}
