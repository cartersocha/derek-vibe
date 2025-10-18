import { z } from "zod";

export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
  description: z.string().optional(),
});

export const sessionSchema = z.object({
  name: z.string().min(1, "Session name is required").max(200),
  campaign_id: z.string().uuid().nullable().optional(),
  session_date: z.string().optional(),
  notes: z.string().optional(),
  header_image_url: z.string().url().optional().nullable(),
});

export const characterSchema = z.object({
  name: z.string().min(1, "Character name is required").max(100),
  race: z.string().nullable().optional(),
  class: z.string().nullable().optional(),
  level: z.number().int().min(1).max(20).nullable().optional(),
  backstory: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
});

export type CampaignFormData = z.infer<typeof campaignSchema>;
export type SessionFormData = z.infer<typeof sessionSchema>;
export type CharacterFormData = z.infer<typeof characterSchema>;
