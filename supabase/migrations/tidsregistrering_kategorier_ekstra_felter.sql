-- Tilføjer ekstern/fakturerbar-klassifikation og mål til kategorier
ALTER TABLE tidsregistrering_kategorier
  ADD COLUMN IF NOT EXISTS er_ekstern    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS er_fakturerbar boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timepris       numeric,
  ADD COLUMN IF NOT EXISTS maal_max_pct  integer,
  ADD COLUMN IF NOT EXISTS maal_min_pct  integer;

COMMENT ON COLUMN tidsregistrering_kategorier.er_ekstern    IS 'Markerer om kategorien tæller som eksternt arbejde (kundemøder, bostedsbesøg, kurser)';
COMMENT ON COLUMN tidsregistrering_kategorier.er_fakturerbar IS 'Markerer om kategorien kan faktureres';
COMMENT ON COLUMN tidsregistrering_kategorier.timepris       IS 'Timepris i DKK — bruges til beregning af fakturerbar værdi';
COMMENT ON COLUMN tidsregistrering_kategorier.maal_max_pct  IS 'Mål: maksimum procentandel af samlet tid';
COMMENT ON COLUMN tidsregistrering_kategorier.maal_min_pct  IS 'Mål: minimum procentandel af samlet tid';
