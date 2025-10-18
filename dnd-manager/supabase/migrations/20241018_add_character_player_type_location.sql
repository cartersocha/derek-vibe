-- Add player_type and last_known_location to characters table
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS player_type TEXT NOT NULL DEFAULT 'npc' CHECK (player_type IN ('npc', 'player')),
  ADD COLUMN IF NOT EXISTS last_known_location TEXT;

-- Ensure existing rows have the default value applied
UPDATE characters
SET player_type = COALESCE(player_type, 'npc');
