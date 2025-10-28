'use client'

import { useFormStatus } from 'react-dom'
import TrashIcon from './trash-icon'

export function DeleteCharacterButton() {
  const { pending } = useFormStatus()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!confirm('Are you sure you want to delete this character?')) {
      e.preventDefault()
    }
  }

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={handleClick}
      className="inline-flex w-auto h-10 bg-[var(--bg-dark)] border border-[var(--red-500)] border-opacity-50 text-[var(--red-500)] px-4 text-sm sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[var(--red-500)] hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center"
    >
      <TrashIcon size="sm" className="bg-[var(--red-500)] hover:bg-black" />
    </button>
  )
}
