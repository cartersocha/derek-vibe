import { z } from 'zod'

export const GROUP_CHARACTER_ROLE_VALUES = ['npc', 'player'] as const

export const groupIdSchema = z.string().uuid()

export const groupIdsSchema = z.array(groupIdSchema).min(1).max(50)

export const groupRoleSchema = z.enum(GROUP_CHARACTER_ROLE_VALUES)

export const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(200),
  description: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
})

export const characterGroupAffiliationSchema = z.object({
  groupId: groupIdSchema,
  role: groupRoleSchema,
})

export type GroupFormData = z.infer<typeof groupSchema>
export type CharacterGroupAffiliationInput = z.infer<typeof characterGroupAffiliationSchema>
