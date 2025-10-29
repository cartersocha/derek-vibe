import type { PlayerSummary, SessionCharacterRelation } from '@/lib/utils'

export type SessionRow = {
  id: string
  name: string
  notes: string | null
  session_date: string | null
  created_at: string | null
  campaign_id: string | null
  campaign: { id: string; name: string } | { id: string; name: string }[] | null
  session_characters: SessionCharacterRelation[] | null
  session_groups: Array<{
    group:
      | { id: string | null; name: string | null }
      | { id: string | null; name: string | null }[]
      | null
  }> | null
}

export type SessionSummary = {
  id: string
  name: string
  session_date: string | null
  notes: string | null
  created_at: string | null
  campaign_id: string | null
  campaign: {
    id: string
    name: string
  } | null
  players: PlayerSummary[]
  groups: Array<{ id: string; name: string }>
}
