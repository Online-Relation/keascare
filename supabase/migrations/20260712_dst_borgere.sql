-- DST HAND01 kvartalscache
-- Gemmer antal borgere i §107/§108 pr. kommune pr. kvartal

create table if not exists dst_borgere (
  id           uuid primary key default gen_random_uuid(),
  kvartal      text not null,           -- fx "2025K4"
  kommune      text not null,
  p107         integer not null default 0,
  p108         integer not null default 0,
  total        integer not null default 0,
  hentet_kl    timestamptz not null default now(),

  unique (kvartal, kommune)
);

create index if not exists dst_borgere_kvartal_idx on dst_borgere (kvartal);
