'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface GroupOption {
  id: string
  name: string
}

interface CharacterGroupFieldProps {
  groups: GroupOption[]
  initialAffiliations?: string[]
}

export function CharacterGroupField({
  groups,
  initialAffiliations = [],
}: CharacterGroupFieldProps) {
  const initialSelection = useMemo(() => {
    const allowedIds = new Set(groups.map((org) => org.id))
    return initialAffiliations.filter((groupId) => allowedIds.has(groupId))
  }, [initialAffiliations, groups])

  const [selection, setSelection] = useState<Set<string>>(new Set(initialSelection))

  useEffect(() => {
    setSelection(new Set(initialSelection))
  }, [initialSelection])

  const toggleGroup = (groupId: string) => {
    setSelection((previous) => {
      const next = new Set(previous)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const selectedCount = selection.size
  const hasGroups = groups.length > 0

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)]">Group Affiliations</h3>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">
            Choose which groups this character belongs to and set their role within each group.
          </p>
        </div>
        <Link
          href="/groups/new"
          className="inline-flex items-center justify-center rounded border border-[var(--cyber-cyan)]/30 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)] transition hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)]"
        >
          New Group
        </Link>
      </div>

      {!hasGroups ? (
        <p className="rounded border border-dashed border-[var(--cyber-cyan)]/20 bg-[var(--bg-dark)] px-4 py-5 text-xs text-[var(--text-muted)]">
          No groups found. Create one first to assign affiliations.
        </p>
      ) : (
        <div className="space-y-3 rounded border border-[var(--cyber-cyan)]/20 bg-[var(--bg-dark)] p-4">
          <ul className="space-y-3">
            {groups.map((group) => {
              const isSelected = selection.has(group.id)

              return (
                <li key={group.id} className="flex flex-col gap-3 rounded border border-[var(--cyber-cyan)]/10 bg-[var(--bg-dark)] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--cyber-cyan)]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleGroup(group.id)}
                      className="h-4 w-4 rounded border-[var(--cyber-cyan)]/40 bg-[var(--bg-dark)] text-[var(--cyber-magenta)] focus:ring-[var(--cyber-magenta)]"
                    />
                    <span>{group.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>

          <div className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
            {selectedCount === 0
              ? 'No groups selected'
              : `${selectedCount} group${selectedCount === 1 ? '' : 's'} selected`}
          </div>
        </div>
      )}

      <input type="hidden" name="group_field_present" value="true" />
      {Array.from(selection).map((groupId) => (
        <input key={groupId} type="hidden" name="group_ids" value={groupId} />
      ))}
    </section>
  )
}
