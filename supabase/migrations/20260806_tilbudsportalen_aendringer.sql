-- Migration: Tilbudsportalen ændringssporing
-- Kør i Supabase SQL Editor

-- 1. Ny tabel til at spore ændringer i TP-data
CREATE TABLE IF NOT EXISTS tilbudsportalen_aendringer (
  id          bigserial PRIMARY KEY,
  afdelingsid text        NOT NULL,
  felt        text        NOT NULL,  -- 'leder', 'pladser', 'telefon', 'driftsform', 'aktuel_godkendelsesstatus'
  gammel      text,
  ny          text,
  opdaget     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tp_aendringer_afdelingsid ON tilbudsportalen_aendringer (afdelingsid);
CREATE INDEX IF NOT EXISTS idx_tp_aendringer_opdaget     ON tilbudsportalen_aendringer (opdaget DESC);

-- 2. Tilføj tp_opdateret til hoved-tabellen (hvornår detaljer sidst blev hentet)
ALTER TABLE tilbudsportalen_tilbud
  ADD COLUMN IF NOT EXISTS tp_opdateret timestamptz;
