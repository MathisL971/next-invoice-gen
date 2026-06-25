ALTER TABLE cotisation_reserves
  ADD COLUMN IF NOT EXISTS declared_at DATE;
