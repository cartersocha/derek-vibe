-- Allow storing non-numeric challenge ratings by converting level to text
ALTER TABLE characters
  ALTER COLUMN level TYPE TEXT USING level::TEXT;
