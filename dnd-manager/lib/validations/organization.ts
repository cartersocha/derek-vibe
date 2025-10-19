import { z } from 'zod'

export const ORGANIZATION_CHARACTER_ROLE_VALUES = ['npc', 'player'] as const

export const organizationIdSchema = z.string().uuid()

export const organizationIdsSchema = z.array(organizationIdSchema).min(1).max(50)

export const organizationRoleSchema = z.enum(ORGANIZATION_CHARACTER_ROLE_VALUES)

export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200),
  description: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
})

export const characterOrganizationAffiliationSchema = z.object({
  organizationId: organizationIdSchema,
  role: organizationRoleSchema,
})

export type OrganizationFormData = z.infer<typeof organizationSchema>
export type CharacterOrganizationAffiliationInput = z.infer<typeof characterOrganizationAffiliationSchema>
