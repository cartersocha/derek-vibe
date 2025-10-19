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
          <h3 className="text-sm font-bold uppercase tracking-[0.35em] text-[#00ffff]">Organization Affiliations</h3>
          <p className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
            Choose which organizations this character belongs to and set their role within each group.
          </p>
        </div>
        <Link
          href="/organizations/new"
          className="inline-flex items-center justify-center rounded border border-[#00ffff]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-[#00ffff] transition hover:border-[#ff00ff] hover:text-[#ff00ff]"
        >
          New Organization
        </Link>
      </div>

      {!hasOrganizations ? (
        <p className="rounded border border-dashed border-[#00ffff]/20 bg-[#050517] px-4 py-5 text-xs text-[#64748b]">
          No organizations found. Create one first to assign affiliations.
        </p>
      ) : (
        <div className="space-y-3 rounded border border-[#00ffff]/20 bg-[#0f0f23] p-4">
          <ul className="space-y-3">
            {organizations.map((organization) => {
              const isSelected = selection.has(organization.id)

              return (
                <li key={organization.id} className="flex flex-col gap-3 rounded border border-[#00ffff]/10 bg-[#050517] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#00ffff]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOrganization(organization.id)}
                      className="h-4 w-4 rounded border-[#00ffff]/40 bg-[#0f0f23] text-[#ff00ff] focus:ring-[#ff00ff]"
                    />
                    <span>{organization.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>

          <div className="text-xs uppercase tracking-[0.3em] text-[#94a3b8]">
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
