-- Cache for SOR (Sundhedsvæsenets Organisationsregister) botilbud
create table if not exists sor_bosteder_cache (
  sor_kode        text primary key,
  navn            text not null,
  cvr             text,
  adresse         text,
  postnummer      text,
  by              text,
  aktiv           boolean not null default true,
  synkroniseret   timestamptz not null default now()
);

create index if not exists sor_bosteder_cache_cvr_idx on sor_bosteder_cache (cvr);
