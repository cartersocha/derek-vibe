import { z } from 'zod'

export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  description: z.string().optional(),
})

export const sessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(200),
  campaign_id: z.string().uuid().nullable().optional(),
  session_date: z.string().optional(),
  notes: z.string().optional(),
  header_image_url: z.string().url().optional().nullable(),
})

export const characterSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(100),
  race: z.string().optional(),
  class: z.string().optional(),
  level: z.number().int().min(1).max(20).optional().nullable(),
  backstory: z.string().optional(),
  image_url: z.string().url().optional().nullable(),
  strength: z.number().int().min(1).max(30).optional().nullable(),
  dexterity: z.number().int().min(1).max(30).optional().nullable(),
  constitution: z.number().int().min(1).max(30).optional().nullable(),
  intelligence: z.number().int().min(1).max(30).optional().nullable(),
  wisdom: z.number().int().min(1).max(30).optional().nullable(),
  charisma: z.number().int().min(1).max(30).optional().nullable(),
})

export type CampaignFormData = z.infer<typeof campaignSchema>
export type SessionFormData = z.infer<typeof sessionSchema>
export type CharacterFormData = z.infer<typeof characterSchema>
