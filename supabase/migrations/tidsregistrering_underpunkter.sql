-- Underpunkter til tidsregistrering kategorier
create table if not exists tidsregistrering_underpunkter (
  id          uuid primary key default gen_random_uuid(),
  kategori_id uuid not null references tidsregistrering_kategorier(id) on delete cascade,
  navn        text not null,
  aktiv       boolean not null default true,
  oprettet    timestamptz default now()
);

-- Tilføj underpunkt-reference til registreringer
alter table tidsregistreringer
  add column if not exists underpunkt_id   uuid references tidsregistrering_underpunkter(id) on delete set null,
  add column if not exists underpunkt_navn text;
