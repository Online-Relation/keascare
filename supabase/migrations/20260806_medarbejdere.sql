-- Migration: KeasCare-medarbejdere med stillingsbetegnelse.
-- Bruges til at angive hvilken medarbejder der er ude på et bosted — ikke login.
-- Kan valgfrit knyttes til en eksisterende auth-bruger (bruger_id), fx hvis
-- medarbejderen også har adgang til systemet.

CREATE TABLE IF NOT EXISTS medarbejdere (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  navn                text          NOT NULL,
  stillingsbetegnelse text,
  telefon             text,
  email               text,
  bruger_id           uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  aktiv               boolean       NOT NULL DEFAULT true,
  oprettet            timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medarbejdere_bruger_id ON medarbejdere (bruger_id);
CREATE INDEX IF NOT EXISTS idx_medarbejdere_aktiv ON medarbejdere (aktiv);
