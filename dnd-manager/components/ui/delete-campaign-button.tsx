'use client'

import { useFormStatus } from 'react-dom'

export function DeleteCampaignButton() {
  const { pending } = useFormStatus()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!confirm('Are you sure you want to delete this campaign? This will not delete associated sessions.')) {
      e.preventDefault()
    }
  }

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={handleClick}
      className="bg-[#0f0f23] border border-red-500 border-opacity-50 text-red-500 px-4 py-2 rounded font-bold uppercase tracking-wider hover:bg-red-500 hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
