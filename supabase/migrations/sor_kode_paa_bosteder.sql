-- Tilføj sor_kode til tabeller med CVR-numre så vi kan matche mod SOR-registret
alter table stps_rapporter
  add column if not exists sor_kode text;

alter table tilbudsportalen_tilbud
  add column if not exists sor_kode text;

-- Indeks til hurtig opslag
create index if not exists stps_rapporter_sor_kode_idx       on stps_rapporter        (sor_kode);
create index if not exists tilbudsportalen_tilbud_sor_kode_idx on tilbudsportalen_tilbud (sor_kode);

-- RPC: match SOR-kode mod stps_rapporter via CVR — returnerer antal opdaterede rækker
create or replace function match_sor_paa_stps()
returns integer
language plpgsql
security definer
as $$
declare
  opdaterede integer;
begin
  update stps_rapporter s
  set    sor_kode = c.sor_kode
  from   sor_bosteder_cache c
  where  replace(s.cvr, ' ', '') = replace(c.cvr, ' ', '')
    and  c.cvr is not null
    and  s.cvr  is not null;
  get diagnostics opdaterede = row_count;
  return opdaterede;
end;
$$;

-- RPC: match SOR-kode mod tilbudsportalen_tilbud via CVR — returnerer antal opdaterede rækker
create or replace function match_sor_paa_tp()
returns integer
language plpgsql
security definer
as $$
declare
  opdaterede integer;
begin
  update tilbudsportalen_tilbud t
  set    sor_kode = c.sor_kode
  from   sor_bosteder_cache c
  where  replace(t.cvr, ' ', '') = replace(c.cvr, ' ', '')
    and  c.cvr is not null
    and  t.cvr  is not null;
  get diagnostics opdaterede = row_count;
  return opdaterede;
end;
$$;
