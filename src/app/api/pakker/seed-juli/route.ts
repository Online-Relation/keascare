// src/app/api/pakker/seed-juli/route.ts
// Engangsroute til at indsætte FMK pakke beboertal for juli 2026

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

const JULI_DATA: Record<string, number> = {
  'Kanonen':          15,
  'Egesborg':         10,
  'Hyldeborg':         6,
  'Cancara':          10,
  'Elverhøj':          7,
  'Egholdt':           3,
  'Scheving':          8,
  'Borning':           8,
  'Oure':              1,
  'Toftehuset':        8,
  'Toldhuset':         8,
  'Secara':            0,
  'Epraidada':         6,
  'Rentas':            8,
  'Cara':              8,
  'Aktiv':            10,
};

export async function POST() {
  const supabase = getSupabaseServerClient();

  // Hent alle monday_kunder for at matche navne til IDs
  const { data: kunder, error: kundeError } = await supabase
    .from('monday_kunder')
    .select('monday_id, navn');

  if (kundeError) return NextResponse.json({ ok: false, fejl: kundeError.message });

  const navnTilId: Record<string, string> = {};
  for (const k of kunder ?? []) {
    if (k.navn && k.monday_id) navnTilId[k.navn] = k.monday_id;
  }

  const rækker = [];
  const ikkeMatchet: string[] = [];

  for (const [bostedNavn, antalBeboere] of Object.entries(JULI_DATA)) {
    // Fuzzy match — find monday_kunde hvis navn indeholder bostedNavn eller omvendt
    const matchetNavn = Object.keys(navnTilId).find(
      (n) => n.toLowerCase().includes(bostedNavn.toLowerCase()) ||
             bostedNavn.toLowerCase().includes(n.toLowerCase()),
    );

    if (!matchetNavn) {
      ikkeMatchet.push(bostedNavn);
      continue;
    }

    rækker.push({
      monday_item_id: navnTilId[matchetNavn],
      bosted_navn:    matchetNavn,
      pakke:          'FMK pakke',
      aar:            2026,
      maaned:         7,
      antal_beboere:  antalBeboere,
      opdateret:      new Date().toISOString(),
    });
  }

  if (rækker.length > 0) {
    const { error } = await supabase
      .from('pakke_beboer_registreringer')
      .upsert(rækker, { onConflict: 'monday_item_id,aar,maaned' });

    if (error) return NextResponse.json({ ok: false, fejl: error.message });
  }

  return NextResponse.json({
    ok: true,
    indsat: rækker.length,
    ikkeMatchet,
    rækker: rækker.map((r) => ({ navn: r.bosted_navn, antal: r.antal_beboere })),
  });
}
