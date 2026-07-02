// src/app/api/monday/kunder-kort/route.ts
// Returnerer kunder med adresse til kortvisning

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type KundeKortPunkt = {
  navn: string;
  adresse: string;
  gruppe: string;
  stpsId: string;
};

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, tp_adresse, adresse, monday_gruppe')
    .not('monday_item_id', 'is', null)
    .or('tp_adresse.not.is.null,adresse.not.is.null');

  if (error) return NextResponse.json([], { status: 500 });

  const punkter: KundeKortPunkt[] = (data ?? []).map((r) => ({
    navn: r.stps_tilbud_navn ?? 'Ukendt',
    adresse: r.tp_adresse ?? r.adresse ?? '',
    gruppe: r.monday_gruppe ?? 'aktive_forloeb',
    stpsId: r.id,
  })).filter((p) => p.adresse);

  return NextResponse.json(punkter);
}
