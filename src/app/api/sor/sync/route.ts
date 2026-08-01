// src/app/api/sor/sync/route.ts
// POST: Synkroniserer SOR-enheder til Supabase-cache

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
    return NextResponse.json({ ok: false, fejl: 'SOR returnerede 0 enheder — tjek API-format' });
  }

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

  const { error } = await supabase
    .from('sor_bosteder_cache')
    .upsert(rækker, { onConflict: 'sor_kode' });

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, synkroniseret: rækker.length });
}
