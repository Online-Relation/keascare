-- Månedlig pris pr. bosted for Stor pakke
create table if not exists pakke_stor_pris (
  id              uuid primary key default gen_random_uuid(),
  monday_item_id  text not null,
  bosted_navn     text not null,
  aar             integer not null,
  maaned          integer not null check (maaned between 1 and 12),
  maanedlig_pris  numeric(10,2) not null check (maanedlig_pris >= 0),
  oprettet        timestamptz default now(),
  opdateret       timestamptz default now(),
  unique (monday_item_id, aar, maaned)
);
