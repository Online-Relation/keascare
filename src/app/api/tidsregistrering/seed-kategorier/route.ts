// src/app/api/tidsregistrering/seed-kategorier/route.ts
// Engangsroute: deaktiverer gamle kategorier og indsætter de 7 nye med underpunkter

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

const NYE_KATEGORIER: { navn: string; underpunkter: string[] }[] = [
  {
    navn: 'Ledelse & Personale',
    underpunkter: [
      'Personalesparring',
      'Ledelsesopfølgning på bosteder',
      'Introduktion og oplæring af nye sygeplejersker',
      'Samarbejde med Sensum',
    ],
  },
  {
    navn: 'Drift af bosteder',
    underpunkter: [
      'Strukturering af forløb',
      'Status på aktive forløb',
      'Opstart af nye bosteder – Tilbud',
      'Opstart af nye bosteder – Databehandleraftaler',
      'Opstart af nye bosteder – Kontrakter',
      'Fakturering',
    ],
  },
  {
    navn: 'Salg & Kundeudvikling',
    underpunkter: [
      'Udarbejdelse af tilbud',
      'Opfølgning på tilbud',
      'Webinarer (Keascare & Sensum)',
      'Kurser på bosteder',
    ],
  },
  {
    navn: 'Faglig kvalitet',
    underpunkter: [
      'Udarbejdelse af instrukser',
      'Revision af instrukser',
      'Faglig kvalitetssikring',
    ],
  },
  {
    navn: 'Private sygeplejeforløb',
    underpunkter: [
      'Forløbsansvar',
      'Opsætning af journaler',
      'FMK',
    ],
  },
  {
    navn: 'IT & Administration',
    underpunkter: [
      'IT-support',
      'Diverse administration',
    ],
  },
  {
    navn: 'Strategi & Forretningsudvikling',
    underpunkter: [
      'Udvikling af nye ydelser',
      'Procesoptimering',
      'Interne projekter',
      'Ledelsesmøder',
      'Strategiarbejde',
    ],
  },
];

export async function POST() {
  const supabase = getSupabaseServerClient();

  // Deaktiver alle eksisterende kategorier
  await supabase.from('tidsregistrering_kategorier').update({ aktiv: false }).neq('id', '00000000-0000-0000-0000-000000000000');

  const oprettet: string[] = [];

  for (const kat of NYE_KATEGORIER) {
    // Opret eller find kategori
    const { data: existing } = await supabase
      .from('tidsregistrering_kategorier')
      .select('id')
      .eq('navn', kat.navn)
      .single();

    let kategoriId: string;

    if (existing) {
      await supabase.from('tidsregistrering_kategorier').update({ aktiv: true }).eq('id', existing.id);
      kategoriId = existing.id;
    } else {
      const { data: ny, error } = await supabase
        .from('tidsregistrering_kategorier')
        .insert({ navn: kat.navn, aktiv: true })
        .select('id')
        .single();
      if (error || !ny) return NextResponse.json({ ok: false, fejl: error?.message });
      kategoriId = ny.id;
    }

    // Deaktiver eksisterende underpunkter for denne kategori
    await supabase.from('tidsregistrering_underpunkter').update({ aktiv: false }).eq('kategori_id', kategoriId);

    // Indsæt underpunkter
    for (const upNavn of kat.underpunkter) {
      const { data: eksUp } = await supabase
        .from('tidsregistrering_underpunkter')
        .select('id')
        .eq('kategori_id', kategoriId)
        .eq('navn', upNavn)
        .single();

      if (eksUp) {
        await supabase.from('tidsregistrering_underpunkter').update({ aktiv: true }).eq('id', eksUp.id);
      } else {
        await supabase.from('tidsregistrering_underpunkter').insert({ kategori_id: kategoriId, navn: upNavn, aktiv: true });
      }
    }

    oprettet.push(kat.navn);
  }

  return NextResponse.json({ ok: true, oprettet });
}
