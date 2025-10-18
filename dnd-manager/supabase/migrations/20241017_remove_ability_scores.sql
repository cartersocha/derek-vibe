-- Remove ability score columns from characters table
ALTER TABLE characters 
  DROP COLUMN IF EXISTS strength,
  DROP COLUMN IF EXISTS dexterity,
  DROP COLUMN IF EXISTS constitution,
  DROP COLUMN IF EXISTS intelligence,
  DROP COLUMN IF EXISTS wisdom,
  DROP COLUMN IF EXISTS charisma;
