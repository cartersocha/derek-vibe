'use client'

import { useFormStatus } from 'react-dom'
import TrashIcon from './trash-icon'

export function DeleteSessionButton() {
  const { pending } = useFormStatus()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      e.preventDefault()
    }
  }

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={handleClick}
      className="w-full sm:w-auto bg-[var(--bg-dark)] border border-[var(--red-500)] border-opacity-50 text-[var(--red-500)] px-4 py-2 text-sm sm:text-base rounded font-bold uppercase tracking-wider hover:bg-[var(--red-500)] hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      <TrashIcon size="sm" className="bg-[var(--red-500)] hover:bg-black" />
    </button>
  )
}
