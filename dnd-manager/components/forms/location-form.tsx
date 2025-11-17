"use client"

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Location } from '@/types/database'
import { Button } from '@/components/ui/button'
import MentionableTextarea from '@/components/ui/mentionable-textarea'
import type { MentionTarget } from '@/lib/mention-utils'

interface LocationFormProps {
  action: (formData: FormData) => Promise<void>
  initialData?: Location | null
  mentionTargets?: MentionTarget[]
}

export default function LocationForm({ action, initialData, mentionTargets = [] }: LocationFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      await action(formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialData?.name ?? ''}
          className="w-full rounded border border-[var(--border-muted)] bg-[var(--bg-panel)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)]"
        />
      </div>

      <div>
        <label
          htmlFor="header_image_url"
          className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider"
        >
          Header Image URL (optional)
        </label>
        <input
          id="header_image_url"
          name="header_image_url"
          type="url"
          defaultValue={initialData?.header_image_url ?? ''}
          placeholder="https://example.com/image.png"
          className="w-full rounded border border-[var(--border-muted)] bg-[var(--bg-panel)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)]"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-bold text-[var(--cyber-cyan)] mb-2 uppercase tracking-wider"
        >
          Notes
        </label>
        <MentionableTextarea
          id="description"
          name="description"
          defaultValue={initialData?.description ?? ''}
          placeholder="Describe this location and @-mention related items"
          mentionTargets={mentionTargets}
        />
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Use @ to mention campaigns, sessions, characters, groups, or locations.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : initialData ? 'Update Location' : 'Create Location'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
