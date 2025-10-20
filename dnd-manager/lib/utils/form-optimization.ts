import { useMemo } from 'react'
import type { EntityOption } from '@/components/ui/entity-multi-select'

/**
 * Optimized utility to convert EntityOption arrays to specialized option types
 * with memoization for better performance
 */
export const useConvertedOptions = (
  campaignOptions: EntityOption[],
  sessionOptions: EntityOption[],
  characterOptions: EntityOption[]
) => {
  const campaignOptionsConverted = useMemo(() => 
    campaignOptions.map(option => ({
      value: option.value,
      label: option.label,
      hint: option.hint,
    })), [campaignOptions]);

  const sessionOptionsConverted = useMemo(() => 
    sessionOptions.map(option => ({
      value: option.value,
      label: option.label,
      hint: option.hint,
    })), [sessionOptions]);

  const characterOptionsConverted = useMemo(() => 
    characterOptions.map(option => ({
      value: option.value,
      label: option.label,
      hint: option.hint,
    })), [characterOptions]);

  return {
    campaignOptionsConverted,
    sessionOptionsConverted,
    characterOptionsConverted,
  }
}

/**
 * Utility to deduplicate and filter string arrays
 */
export const dedupeList = (values?: string[]) => Array.from(new Set((values ?? []).filter(Boolean)));

/**
 * Utility to check if two arrays match exactly
 */
export const listsMatch = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);
