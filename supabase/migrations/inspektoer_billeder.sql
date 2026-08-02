-- Tabel til at gemme Supabase Storage URL for inspektørbilleder
create table if not exists inspektoer_billeder (
  slug        text primary key,
  billede_url text not null,
  opdateret   timestamptz default now()
);

-- Storage bucket til inspektørbilleder (kør i Supabase Dashboard hvis det ikke findes)
-- insert into storage.buckets (id, name, public) values ('inspektoer-billeder', 'inspektoer-billeder', true)
-- on conflict do nothing;
