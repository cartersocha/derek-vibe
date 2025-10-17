export interface Campaign {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
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
}

export interface Character {
  id: string
  name: string
  race: string | null
  class: string | null
  level: number | null
  backstory: string | null
  image_url: string | null
  strength: number | null
  dexterity: number | null
  constitution: number | null
  intelligence: number | null
  wisdom: number | null
  charisma: number | null
  created_at: string
  updated_at: string
  sessions?: Session[]
}

export interface SessionCharacter {
  id: string
  session_id: string
  character_id: string
  created_at: string
}
