"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import MultiSelectDropdown from "./multi-select-dropdown"
import { updateCharacterSessions } from "@/lib/actions/characters"

type Option = {
  id: string
  label: string
  subLabel?: string | null
  checked: boolean
}

type SessionManagerProps = {
  characterId: string
  options: Option[]
  emptyMessage?: string
  submitLabel?: string
  className?: string
  menuWidthClass?: string
}

export default function SessionManager({
  characterId,
  options,
  emptyMessage = "No sessions available",
  submitLabel = "Save Sessions",
  className,
  menuWidthClass,
}: SessionManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSessionUpdate = async (selectedIds: string[]) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        const uniqueSelections = Array.from(new Set(selectedIds)).filter(Boolean)
        uniqueSelections.forEach((sessionId) => formData.append('session_ids', sessionId))
        
        await updateCharacterSessions(characterId, formData)
        router.refresh()
      } catch (error) {
        console.error('Failed to update character sessions:', error)
      }
    })
  }

  return (
    <MultiSelectDropdown
      label="Manage Sessions"
      options={options}
      onSubmit={handleSessionUpdate}
      emptyMessage={emptyMessage}
      submitLabel={submitLabel}
      className={className}
      menuWidthClass={menuWidthClass}
    />
  )
}
