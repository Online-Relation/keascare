-- Tabel til registrering af beboere per pakke per måned
create table if not exists pakke_beboer_registreringer (
  id                uuid primary key default gen_random_uuid(),
  monday_item_id    text not null,
  bosted_navn       text not null,
  pakke             text not null,
  aar               integer not null,
  maaned            integer not null check (maaned between 1 and 12),
  antal_beboere     integer not null check (antal_beboere >= 0),
  oprettet          timestamptz default now(),
  opdateret         timestamptz default now(),
  unique (monday_item_id, aar, maaned)
);

-- RLS
alter table pakke_beboer_registreringer enable row level security;

create policy "Alle autentificerede kan læse"
  on pakke_beboer_registreringer for select
  using (auth.role() = 'authenticated');

create policy "Alle autentificerede kan skrive"
  on pakke_beboer_registreringer for insert
  with check (auth.role() = 'authenticated');

create policy "Alle autentificerede kan opdatere"
  on pakke_beboer_registreringer for update
  using (auth.role() = 'authenticated');
