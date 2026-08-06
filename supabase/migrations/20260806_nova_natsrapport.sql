-- Migration: Nova natsrapport — gemmer hvad Nova arbejdede på i nat
CREATE TABLE IF NOT EXISTS nova_natsrapport (
  id            bigserial    PRIMARY KEY,
  udfort_dato   timestamptz  NOT NULL DEFAULT now(),
  cvr_beriget   int,
  tp_beriget    int,
  tp_requeued   int,
  los_matchet   int,
  monday_matchet int,
  total_fejl    int,
  radata        jsonb
);

CREATE INDEX IF NOT EXISTS idx_nova_natsrapport_dato ON nova_natsrapport (udfort_dato DESC);
