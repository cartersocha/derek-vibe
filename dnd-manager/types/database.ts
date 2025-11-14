import type { CharacterStatus, PlayerType } from "@/lib/characters/constants"

export interface Campaign {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  map_id: string | null
}

export interface Session {
  id: string
  campaign_id: string | null
  name: string
  session_date: string | null
  notes: string | null
  header_image_url: string | null
  created_at: string
  updated_at: string
  campaign?: Campaign
  characters?: Character[]
  locations?: Location[]
}

export interface Character {
  id: string
  name: string
  race: string | null
  class: string | null
  level: string | null
  backstory: string | null
  image_url: string | null
  player_type: PlayerType
  last_known_location: string | null
  status: CharacterStatus
  created_at: string
  updated_at: string
  sessions?: Session[]
  locations?: Location[]
}

export interface SessionCharacter {
  id: string
  session_id: string
  character_id: string
  created_at: string
}

export interface Location {
  id: string
  name: string
  summary: string | null
  description: string | null
  primary_campaign_id: string | null
  map_marker_icon: string | null
  created_at: string
  updated_at: string
  campaigns?: Campaign[]
  sessions?: Session[]
  characters?: Character[]
  groups?: Group[]
}

export interface Group {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
  campaigns?: Campaign[]
  sessions?: Session[]
  characters?: Character[]
  locations?: Location[]
}

export interface MapRecord {
  id: string
  name: string
  description: string | null
  image_url: string
  natural_width: number | null
  natural_height: number | null
  created_at: string
  updated_at: string
  campaigns?: Campaign[]
  pins?: MapPin[]
}

export interface MapPin {
  id: string
  map_id: string
  location_id: string
  x_percent: number
  y_percent: number
  label: string | null
  created_at: string
  updated_at: string
  location?: Location
}
