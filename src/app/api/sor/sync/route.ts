// src/app/api/sor/sync/route.ts
// POST: Synkroniserer SOR-enheder til cache og matcher CVR mod stps_rapporter + tilbudsportalen_tilbud

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { hentAlleSorEnheder } from '@/lib/api/SorClient';

export async function POST() {
  const supabase = getSupabaseServerClient();

  let enheder;
  try {
    enheder = await hentAlleSorEnheder(50);
  } catch (fejl) {
    return NextResponse.json({ ok: false, fejl: String(fejl) }, { status: 502 });
  }

  if (enheder.length === 0) {
    return NextResponse.json({ ok: false, fejl: 'SOR returnerede 0 enheder — tjek API-format og endpoint-URL' });
  }

  // 1. Upsert til cache
  const rækker = enheder.map((e) => ({
    sor_kode: e.sorKode,
    navn: e.navn,
    cvr: e.cvr,
    adresse: e.adresse,
    postnummer: e.postnummer,
    by: e.by,
    aktiv: e.aktiv,
    synkroniseret: new Date().toISOString(),
  }));

  const { error: cacheError } = await supabase
    .from('sor_bosteder_cache')
    .upsert(rækker, { onConflict: 'sor_kode' });

  if (cacheError) return NextResponse.json({ ok: false, fejl: cacheError.message }, { status: 500 });

  // 2. Kør CVR-match direkte i Supabase med én SQL-sætning pr. tabel
  //    UPDATE tabel SET sor_kode = cache.sor_kode FROM sor_bosteder_cache WHERE tabel.cvr = cache.cvr
  const [stpsResult, tpResult] = await Promise.all([
    supabase.rpc('match_sor_paa_stps'),
    supabase.rpc('match_sor_paa_tp'),
  ]);

  return NextResponse.json({
    ok: true,
    synkroniseret: rækker.length,
    stpsMatchet: stpsResult.data ?? 0,
    tpMatchet: tpResult.data ?? 0,
    stpsFejl: stpsResult.error?.message ?? null,
    tpFejl: tpResult.error?.message ?? null,
  });
}
