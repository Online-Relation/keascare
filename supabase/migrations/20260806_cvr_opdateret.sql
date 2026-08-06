-- Tilføj cvr_opdateret til stps_rapporter så Nova ved hvornår CVR-data sidst blev genhentet.
-- Sættes til now() første gang CVR-nummer gemmes, og opdateres ved periodisk genopslag.
ALTER TABLE stps_rapporter ADD COLUMN IF NOT EXISTS cvr_opdateret timestamptz;

-- Tilføj cvr_opdateret til nova_natsrapport så vi kan se hvor mange bosteder der blev genopslået.
ALTER TABLE nova_natsrapport ADD COLUMN IF NOT EXISTS cvr_opdateret int;
