-- Migration: Tilføj Monday-matchfelter til stps_rapporter og tilbudsportalen_tilbud
-- Kør i Supabase SQL Editor

ALTER TABLE stps_rapporter
  ADD COLUMN IF NOT EXISTS monday_item_id    TEXT,
  ADD COLUMN IF NOT EXISTS monday_gruppe     TEXT,
  ADD COLUMN IF NOT EXISTS monday_match_dato TIMESTAMPTZ;

ALTER TABLE tilbudsportalen_tilbud
  ADD COLUMN IF NOT EXISTS monday_item_id    TEXT,
  ADD COLUMN IF NOT EXISTS monday_gruppe     TEXT,
  ADD COLUMN IF NOT EXISTS monday_match_dato TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_stps_rapporter_monday_item_id
  ON stps_rapporter (monday_item_id)
  WHERE monday_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tilbudsportalen_monday_item_id
  ON tilbudsportalen_tilbud (monday_item_id)
  WHERE monday_item_id IS NOT NULL;
