-- Kør denne migration i Supabase SQL Editor
-- Opretter scraper_status tabellen til live kørselsstatus

CREATE TABLE IF NOT EXISTS scraper_status (
  scraper_id     text PRIMARY KEY,
  status         text NOT NULL DEFAULT 'idle',   -- 'idle' | 'kører' | 'fejl'
  startet_kl     timestamptz,
  opdateret_kl   timestamptz DEFAULT now(),
  progress       integer NOT NULL DEFAULT 0,
  total          integer NOT NULL DEFAULT 0
);

-- Seed med alle kendte scrapers (starter som idle)
INSERT INTO scraper_status (scraper_id, status) VALUES
  ('stps-liste',      'idle'),
  ('stps-detaljer',   'idle'),
  ('stps-fund-items', 'idle'),
  ('stps-pnummer',    'idle'),
  ('cvr-berig',       'idle'),
  ('cvr-ansatte',     'idle'),
  ('regnskab',        'idle'),
  ('tp-liste',        'idle'),
  ('tp-detaljer',     'idle'),
  ('monday-sync',     'idle'),
  ('tp-match',        'idle')
ON CONFLICT (scraper_id) DO NOTHING;
