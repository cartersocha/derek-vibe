import { z } from "zod";
import { CHARACTER_STATUS_VALUES, PLAYER_TYPE_VALUES } from "@/lib/characters/constants";

export const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
  description: z.string().optional(),
});

export const sessionSchema = z.object({
  name: z.string().min(1, "Session name is required").max(200),
  campaign_id: z.string().uuid().nullable().optional(),
  session_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  header_image_url: z.string().url().optional().nullable(),
});

export const characterSchema = z.object({
  name: z.string().min(1, "Character name is required").max(100),
  race: z.string().nullable().optional(),
  class: z.string().nullable().optional(),
  level: z.string().max(50).nullable().optional(),
  backstory: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  player_type: z.enum(PLAYER_TYPE_VALUES).default("npc"),
  last_known_location: z.string().max(200).nullable().optional(),
  status: z.enum(CHARACTER_STATUS_VALUES).default("alive"),
});

export const locationSchema = z.object({
  name: z.string().min(1, "Location name is required").max(200),
  description: z.string().nullable().optional(),
  header_image_url: z.string().url().nullable().optional(),
});

export type CampaignFormData = z.infer<typeof campaignSchema>;
export type SessionFormData = z.infer<typeof sessionSchema>;
export type CharacterFormData = z.infer<typeof characterSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
