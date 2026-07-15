// src/app/api/scrapers/stps/debug-upsert/route.ts
// Henter side 1 fra STPS og upsetter direkte via Supabase — returnerer faktiske fejl

import { NextResponse } from 'next/server';
import { scraperListeSider } from '@/features/stps/scraper/StpsListScraper';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import {
  mapSanktionerTilFundNiveau,
  udtraekSanktioner,
  udtraekFokusOmraader,
  udtraekKommune,
  udtraekRegion,
  udtraekTilsynsform,
  udtraekTemaer,
} from '@/features/stps/mappers/StpsFundMapper';

export async function GET() {
  try {
    const items = await scraperListeSider(1);
    const supabase = getSupabaseServerClient();
    const resultater = [];

    for (const item of items) {
      const sanktioner = udtraekSanktioner(item.tags);

      const payload = {
        stps_tilbud_navn: item.navn,
        rapport_titel:    item.navn,
        rapport_dato:     item.rapportDato || null,
        rapport_url:      item.detailUrl,
        pdf_url:          null,
        stps_konklusion:  sanktioner.join(', ') || null,
        fund_niveau:      mapSanktionerTilFundNiveau(item.tags),
        fokus_omraader:   udtraekFokusOmraader(item.tags),
        raa_tekst:        null,
        kommune:          udtraekKommune(item.tags),
        region:           udtraekRegion(item.tags),
        tilsynsform:      udtraekTilsynsform(item.tags),
        temaer:           udtraekTemaer(item.tags),
        besoeg_dato:      item.besoegsDato ?? null,
      };

      const { error } = await supabase
        .from('stps_rapporter')
        .upsert(payload, { onConflict: 'rapport_url', ignoreDuplicates: false });

      resultater.push({
        navn: item.navn,
        rapportDato: item.rapportDato,
        ok: !error,
        supabaseFejl: error ? { code: error.code, message: error.message, details: error.details } : null,
      });
    }

    return NextResponse.json({ antal: items.length, resultater });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
