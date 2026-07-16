-- Regelovervågning: fælles tabel til Retsinformation og STPS-nyheder

CREATE TABLE IF NOT EXISTS regulatory_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source              text NOT NULL,         -- 'retsinformation' | 'stps'
  external_id         text NOT NULL,         -- stabil nøgle fra kilden
  source_type         text,                  -- lov, bekendtgørelse, vejledning, nyhed, udgivelse mv.
  title               text NOT NULL,
  summary             text,
  body_text           text,
  source_url          text,
  published_at        timestamptz,
  changed_at_source   timestamptz,
  first_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  relevance_score     integer DEFAULT 0,
  relevance_level     text DEFAULT 'lav',    -- 'lav' | 'middel' | 'høj'
  topics              text[] DEFAULT '{}',
  recommended_action  text,
  review_status       text DEFAULT 'ny',     -- 'ny' | 'læst' | 'relevant' | 'ikke_relevant' | 'handling'
  internal_note       text,
  raw_payload         jsonb,
  UNIQUE (source, external_id)
);

CREATE TABLE IF NOT EXISTS regulatory_item_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         uuid NOT NULL REFERENCES regulatory_items(id) ON DELETE CASCADE,
  changed_at      timestamptz NOT NULL DEFAULT now(),
  change_reason   text,
  snapshot        jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_regulatory_items_source ON regulatory_items(source);
CREATE INDEX IF NOT EXISTS idx_regulatory_items_relevance ON regulatory_items(relevance_level);
CREATE INDEX IF NOT EXISTS idx_regulatory_items_status ON regulatory_items(review_status);
CREATE INDEX IF NOT EXISTS idx_regulatory_items_published ON regulatory_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_regulatory_history_item ON regulatory_item_history(item_id);
