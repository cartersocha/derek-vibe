import { z } from 'zod'

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(200),
  summary: z.string().max(500).nullable().optional(),
  description: z.string().nullable().optional(),
  primary_campaign_id: z.string().uuid().nullable().optional(),
  map_marker_icon: z.string().url().nullable().optional(),
})

export const mapSchema = z.object({
  name: z.string().min(1, 'Map name is required').max(200),
  description: z.string().nullable().optional(),
  image_url: z.string().url(),
  natural_width: z.number().int().positive().nullable().optional(),
  natural_height: z.number().int().positive().nullable().optional(),
})

export const mapPinSchema = z.object({
  map_id: z.string().uuid(),
  location_id: z.string().uuid(),
  x_percent: z.number().min(0).max(100),
  y_percent: z.number().min(0).max(100),
  label: z.string().max(200).nullable().optional(),
})

export type LocationInput = z.infer<typeof locationSchema>
export type MapInput = z.infer<typeof mapSchema>
export type MapPinInput = z.infer<typeof mapPinSchema>
