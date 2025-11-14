"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import MentionableTextarea from '@/components/ui/mentionable-textarea'
import ImageUpload from '@/components/ui/image-upload'
import { EntityMultiSelect, type EntityOption } from '@/components/ui/entity-multi-select'
import type { MentionTarget } from '@/lib/mention-utils'

interface LocationFormProps {
  action: (formData: FormData) => Promise<void>
  cancelHref: string
  submitLabel: string
  mentionTargets: MentionTarget[]
  campaignOptions: EntityOption[]
  sessionOptions: EntityOption[]
  groupOptions: EntityOption[]
  characterOptions: EntityOption[]
  defaultValues?: {
    name?: string
    summary?: string | null
    description?: string | null
    primaryCampaignId?: string | null
    markerUrl?: string | null
    campaignIds?: string[]
    sessionIds?: string[]
    groupIds?: string[]
    characterIds?: string[]
  }
}

export function LocationForm({
  action,
  cancelHref,
  submitLabel,
  mentionTargets,
  campaignOptions,
  sessionOptions,
  groupOptions,
  characterOptions,
  defaultValues,
}: LocationFormProps) {
  const [campaignIds, setCampaignIds] = useState<string[]>(() => defaultValues?.campaignIds ?? [])
  const [sessionIds, setSessionIds] = useState<string[]>(() => defaultValues?.sessionIds ?? [])
  const [groupIds, setGroupIds] = useState<string[]>(() => defaultValues?.groupIds ?? [])
  const [characterIds, setCharacterIds] = useState<string[]>(() => defaultValues?.characterIds ?? [])

  const primaryCampaignOptions = useMemo(() => {
    return [{ value: '', label: 'No primary campaign' }, ...campaignOptions]
  }, [campaignOptions])

  return (
    <form action={action} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-bold uppercase tracking-widest text-[var(--cyber-cyan)]">
              Location Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={defaultValues?.name ?? ''}
              required
              className="mt-2 w-full rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-[var(--bg-dark)] px-4 py-3 font-mono text-sm text-[var(--cyber-cyan)] shadow-inner shadow-[var(--cyber-cyan)]/10 focus:border-[var(--cyber-magenta)] focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)]"
              placeholder="Enter a name"
            />
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-bold uppercase tracking-widest text-[var(--cyber-cyan)]">
              Summary
            </label>
            <textarea
              id="summary"
              name="summary"
              defaultValue={defaultValues?.summary ?? ''}
              className="mt-2 w-full min-h-[120px] rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-[var(--bg-dark)] px-4 py-3 font-mono text-sm text-[var(--cyber-cyan)] focus:border-[var(--cyber-magenta)] focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)]"
              placeholder="Short summary visible in cards"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-[var(--cyber-cyan)]">
              Description & Notes
            </label>
            <MentionableTextarea
              name="description"
              initialValue={defaultValues?.description ?? ''}
              mentionTargets={mentionTargets}
              className="mt-2 w-full rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-[var(--bg-dark)] px-4 py-3 font-mono text-sm text-[var(--cyber-cyan)] focus:border-[var(--cyber-magenta)] focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)]"
              placeholder="Add lore, landmarks, rumours..."
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="primary_campaign_id" className="block text-sm font-bold uppercase tracking-widest text-[var(--cyber-cyan)]">
              Primary Campaign
            </label>
            <select
              id="primary_campaign_id"
              name="primary_campaign_id"
              defaultValue={defaultValues?.primaryCampaignId ?? ''}
              className="mt-2 w-full rounded border border-[var(--cyber-cyan)] border-opacity-30 bg-[var(--bg-dark)] px-4 py-3 font-mono text-sm text-[var(--cyber-cyan)] focus:border-[var(--cyber-magenta)] focus:outline-none focus:ring-2 focus:ring-[var(--cyber-magenta)]"
            >
              {primaryCampaignOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[var(--bg-dark)] text-[var(--cyber-cyan)]">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <EntityMultiSelect
            id="location-campaigns"
            name="campaign_ids"
            options={campaignOptions}
            value={campaignIds}
            onChange={setCampaignIds}
            placeholder="Linked campaigns"
            emptyMessage="No campaigns yet"
            createOption={{ href: '/campaigns/new', label: 'Campaign' }}
          />

          <EntityMultiSelect
            id="location-sessions"
            name="session_ids"
            options={sessionOptions}
            value={sessionIds}
            onChange={setSessionIds}
            placeholder="Sessions at this location"
            emptyMessage="No sessions yet"
            createOption={{ href: '/sessions/new', label: 'Session' }}
          />

          <EntityMultiSelect
            id="location-groups"
            name="group_ids"
            options={groupOptions}
            value={groupIds}
            onChange={setGroupIds}
            placeholder="Groups tied here"
            emptyMessage="No groups yet"
            createOption={{ href: '/groups/new', label: 'Group' }}
          />

          <EntityMultiSelect
            id="location-characters"
            name="character_ids"
            options={characterOptions}
            value={characterIds}
            onChange={setCharacterIds}
            placeholder="Notable characters"
            emptyMessage="No characters yet"
            createOption={{ href: '/characters/new', label: 'Character' }}
          />

          <ImageUpload
            name="map_marker_icon"
            label="Custom Marker Icon"
            currentImage={defaultValues?.markerUrl ?? undefined}
            maxSize={3}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded border border-[var(--cyber-cyan)]/60 px-6 py-3 font-mono text-sm uppercase tracking-[0.3em] text-[var(--cyber-cyan)] transition hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-[var(--cyber-magenta)] px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.3em] text-black shadow-lg shadow-[var(--cyber-magenta)]/40 transition hover:bg-[var(--cyber-magenta)]/90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
