'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface OrganizationOption {
  id: string
  name: string
}

interface CharacterOrganizationFieldProps {
  organizations: OrganizationOption[]
  initialAffiliations?: string[]
}

export function CharacterOrganizationField({
  organizations,
  initialAffiliations = [],
}: CharacterOrganizationFieldProps) {
  const initialSelection = useMemo(() => {
    const allowedIds = new Set(organizations.map((org) => org.id))
    return initialAffiliations.filter((organizationId) => allowedIds.has(organizationId))
  }, [initialAffiliations, organizations])

  const [selection, setSelection] = useState<Set<string>>(new Set(initialSelection))

  useEffect(() => {
    setSelection(new Set(initialSelection))
  }, [initialSelection])

  const toggleOrganization = (organizationId: string) => {
    setSelection((previous) => {
      const next = new Set(previous)
      if (next.has(organizationId)) {
        next.delete(organizationId)
      } else {
        next.add(organizationId)
      }
      return next
    })
  }

  const selectedCount = selection.size
  const hasOrganizations = organizations.length > 0

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)]">Organization Affiliations</h3>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)]">
            Choose which organizations this character belongs to and set their role within each group.
          </p>
        </div>
        <Link
          href="/organizations/new"
          className="inline-flex items-center justify-center rounded border border-[var(--cyber-cyan)]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-[var(--cyber-cyan)] transition hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)]"
        >
          New Organization
        </Link>
      </div>

      {!hasOrganizations ? (
        <p className="rounded border border-dashed border-[var(--cyber-cyan)]/20 bg-[var(--bg-dark)] px-4 py-5 text-xs text-[var(--text-muted)]">
          No organizations found. Create one first to assign affiliations.
        </p>
      ) : (
        <div className="space-y-3 rounded border border-[var(--cyber-cyan)]/20 bg-[var(--bg-dark)] p-4">
          <ul className="space-y-3">
            {organizations.map((organization) => {
              const isSelected = selection.has(organization.id)

              return (
                <li key={organization.id} className="flex flex-col gap-3 rounded border border-[var(--cyber-cyan)]/10 bg-[var(--bg-dark)] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--cyber-cyan)]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOrganization(organization.id)}
                      className="h-4 w-4 rounded border-[var(--cyber-cyan)]/40 bg-[var(--bg-dark)] text-[var(--cyber-magenta)] focus:ring-[var(--cyber-magenta)]"
                    />
                    <span>{organization.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>

          <div className="text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
            {selectedCount === 0
              ? 'No organizations selected'
              : `${selectedCount} organization${selectedCount === 1 ? '' : 's'} selected`}
          </div>
        </div>
      )}

      <input type="hidden" name="organization_field_present" value="true" />
      {Array.from(selection).map((organizationId) => (
        <input key={organizationId} type="hidden" name="organization_ids" value={organizationId} />
      ))}
    </section>
  )
}
