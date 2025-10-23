/**
 * Utility functions for sanitizing search inputs across the application
 */

import { sanitizeSearchQuery } from '@/lib/security/sanitize'

/**
 * Sanitizes a search query for use in filtering operations
 */
export function sanitizeSearchInput(search: string): string {
  return sanitizeSearchQuery(search).trim()
}

/**
 * Sanitizes a search query and converts to lowercase for case-insensitive matching
 */
export function sanitizeSearchForFiltering(search: string): string {
  return sanitizeSearchInput(search).toLowerCase()
}

/**
 * Sanitizes a search query for mention queries
 */
export function sanitizeMentionSearchInput(search: string): string {
  return sanitizeSearchInput(search)
}
