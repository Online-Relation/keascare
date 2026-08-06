-- Migration: Daglig kvalitetsscore snapshot
CREATE TABLE IF NOT EXISTS nova_kvalitet_snapshot (
  id          bigserial    PRIMARY KEY,
  snapshot_dato date        NOT NULL DEFAULT current_date,
  score       int          NOT NULL,
  total       int          NOT NULL,
  med_cvr     int          NOT NULL DEFAULT 0,
  med_tp      int          NOT NULL DEFAULT 0,
  med_kontakt int          NOT NULL DEFAULT 0,
  med_pdf     int          NOT NULL DEFAULT 0,
  med_monday  int          NOT NULL DEFAULT 0,
  med_los     int          NOT NULL DEFAULT 0,
  UNIQUE (snapshot_dato)  -- kun ét snapshot pr. dag
);

CREATE INDEX IF NOT EXISTS idx_nova_kvalitet_dato ON nova_kvalitet_snapshot (snapshot_dato DESC);
