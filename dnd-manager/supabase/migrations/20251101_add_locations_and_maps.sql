-- Locations and Maps feature

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  primary_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  map_marker_icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Join tables linking locations to other entities
CREATE TABLE IF NOT EXISTS location_characters (
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (location_id, character_id)
);

CREATE TABLE IF NOT EXISTS location_sessions (
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (location_id, session_id)
);

CREATE TABLE IF NOT EXISTS location_groups (
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (location_id, group_id)
);

CREATE TABLE IF NOT EXISTS location_campaigns (
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (location_id, campaign_id)
);

-- Maps and pins
CREATE TABLE IF NOT EXISTS maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  natural_width INTEGER,
  natural_height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow campaigns to optionally reference a map
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS map_id UUID REFERENCES maps(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS map_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  x_percent NUMERIC(5, 2) NOT NULL,
  y_percent NUMERIC(5, 2) NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_primary_campaign ON locations(primary_campaign_id);
CREATE INDEX IF NOT EXISTS idx_location_characters_character ON location_characters(character_id);
CREATE INDEX IF NOT EXISTS idx_location_sessions_session ON location_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_location_groups_group ON location_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_location_campaigns_campaign ON location_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_maps_name ON maps(name);
CREATE INDEX IF NOT EXISTS idx_map_pins_map_id ON map_pins(map_id);
CREATE INDEX IF NOT EXISTS idx_map_pins_location_id ON map_pins(location_id);

-- Updated_at triggers
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maps_updated_at
  BEFORE UPDATE ON maps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_map_pins_updated_at
  BEFORE UPDATE ON map_pins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
