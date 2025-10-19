/**
 * Shared utility functions for handling FormData across server actions
 */

export function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

export function getStringOrNull(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key)
  if (value instanceof File && value.size > 0) {
    return value
  }
  return null
}

export function getIdList(formData: FormData, field: string): string[] {
  const rawValues = formData
    .getAll(field)
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)

  return Array.from(new Set(rawValues))
}

export function getDateValue(formData: FormData, field: string): string | null {
  const rawValue = formData.get(field)
  if (typeof rawValue !== 'string') {
    return null
  }

  const trimmed = rawValue.trim()
  if (!trimmed) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map((value) => Number.parseInt(value, 10))
    if ([year, month, day].some((value) => Number.isNaN(value))) {
      return null
    }

    return new Date(Date.UTC(year, month - 1, day)).toISOString()
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}
