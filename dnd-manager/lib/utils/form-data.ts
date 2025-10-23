/**
 * Shared utility functions for handling FormData across server actions
 */

import { 
  sanitizeText, 
  sanitizeNullableText, 
  sanitizeName,
  sanitizeDescription,
  sanitizeNotes,
  sanitizeBackstory,
  sanitizeLocation,
  sanitizeRace,
  sanitizeClass,
  sanitizeLevel,
  sanitizeRole,
  sanitizeRichText,
  isValidName,
  isValidDescription,
  isValidNotes,
  isValidBackstory,
  isValidLocation,
  isValidRace,
  isValidClass,
  isValidLevel,
  isValidRole
} from '@/lib/security/sanitize'

export function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeText(value.trim())
}

export function getStringOrNull(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return null
  }
  return sanitizeNullableText(value.trim())
}

// Enhanced sanitization functions for specific field types
export function getName(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeName(value.trim())
}

export function getDescription(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeDescription(value.trim())
}

export function getNotes(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeNotes(value.trim())
}

export function getBackstory(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeBackstory(value.trim())
}

export function getLocation(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeLocation(value.trim())
}

export function getRace(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeRace(value.trim())
}

export function getClass(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeClass(value.trim())
}

export function getLevel(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeLevel(value.trim())
}

export function getRole(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeRole(value.trim())
}

export function getRichText(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return ''
  }
  return sanitizeRichText(value.trim())
}

// Validation functions
export function validateName(value: string): boolean {
  return isValidName(value)
}

export function validateDescription(value: string): boolean {
  return isValidDescription(value)
}

export function validateNotes(value: string): boolean {
  return isValidNotes(value)
}

export function validateBackstory(value: string): boolean {
  return isValidBackstory(value)
}

export function validateLocation(value: string): boolean {
  return isValidLocation(value)
}

export function validateRace(value: string): boolean {
  return isValidRace(value)
}

export function validateClass(value: string): boolean {
  return isValidClass(value)
}

export function validateLevel(value: string): boolean {
  return isValidLevel(value)
}

export function validateRole(value: string): boolean {
  return isValidRole(value)
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
