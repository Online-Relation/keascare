-- Tilføj gigant-markering til bosteder
ALTER TABLE stps_rapporter ADD COLUMN IF NOT EXISTS er_gigant boolean NOT NULL DEFAULT false;
