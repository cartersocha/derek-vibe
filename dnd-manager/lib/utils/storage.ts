/**
 * Shared storage constants and utilities
 */

export const STORAGE_BUCKETS = {
  CHARACTERS: 'character-images',
  SESSIONS: 'session-images', 
  GROUPS: 'group-logos',
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]
