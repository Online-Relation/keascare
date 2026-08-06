-- Tracker hvornår tilsyn_deltagere_stps/bosted sidst blev (gen)parset.
-- NULL = aldrig parset med nuværende parser-version → plukkes op af repars-deltagere-batchen.
ALTER TABLE stps_rapporter ADD COLUMN IF NOT EXISTS tilsyn_deltagere_parset_dato timestamptz;
