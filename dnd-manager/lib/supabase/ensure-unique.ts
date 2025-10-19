import type { SupabaseClient } from '@supabase/supabase-js'

const DUPLICATE_ERROR_DEFAULT = 'A record with the same value already exists.'

export type EnsureUniqueOptions = {
  table: string
  column: string
  value: string
  excludeId?: string | null
  errorMessage?: string
}

/**
 * Prevent inserting duplicate values by performing a case-insensitive lookup before writes.
 */
export async function assertUniqueValue(
  supabase: SupabaseClient,
  { table, column, value, excludeId, errorMessage }: EnsureUniqueOptions
): Promise<void> {
  const normalizedValue = value.trim()
  if (!normalizedValue) {
    return
  }

  let query = supabase
    .from(table)
    .select(`id, ${column}`)
    .limit(5)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const escapedValue = escapeForPattern(normalizedValue)
  const { data, error } = await query.ilike(column, escapedValue)

  if (error) {
    throw new Error(error.message)
  }

  const rows = Array.isArray(data)
    ? (data as unknown as Record<string, unknown>[])
    : []

  const duplicateFound = rows.some((row) => {
    const raw = row?.[column]
    if (typeof raw !== 'string') {
      return false
    }

    const candidate = raw.trim()
    return candidate.localeCompare(normalizedValue, undefined, { sensitivity: 'base' }) === 0
  })

  if (duplicateFound) {
    throw new Error(errorMessage ?? DUPLICATE_ERROR_DEFAULT)
  }
}

function escapeForPattern(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`)
}
