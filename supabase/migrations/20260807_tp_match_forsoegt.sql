-- Migration: spor hvornår vi sidst FORSØGTE at matche en STPS-rapport mod
-- Tilbudsportalen (uanset om det lykkedes). Uden denne blev rækker der aldrig
-- fandt et match ved en fejl valgt igen og igen i samme batch hver nat —
-- nyligt tilføjede CVR'er kunne derfor sidde fast bag en kø der aldrig rykkede sig.
ALTER TABLE stps_rapporter ADD COLUMN IF NOT EXISTS tp_match_forsoegt timestamptz;

-- Samme problem gjaldt P-nummer→CVR-opslaget: rapporter hvor CVR-opslaget
-- ikke fandt noget blev valgt igen og igen i samme batch hver nat.
ALTER TABLE stps_rapporter ADD COLUMN IF NOT EXISTS pnummer_match_forsoegt timestamptz;
