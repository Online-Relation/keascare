// src/app/api/scrapers/stps/debug-upsert/route.ts
// Henter side 1 fra STPS, upsetter hvert item og rapporterer resultatet — bruges til fejlsøgning

import { NextResponse } from 'next/server';
import { scraperListeSider } from '@/features/stps/scraper/StpsListScraper';
import { upsertStpsRapport } from '@/features/stps/repository/StpsRepository';
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
    const resultater = [];

    for (const item of items) {
      try {
        const sanktioner = udtraekSanktioner(item.tags);
        const gemt = await upsertStpsRapport({
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
          besoegsDato:      item.besoegsDato ?? null,
        });
        resultater.push({ navn: item.navn, rapportDato: item.rapportDato, gemt, fejl: null });
      } catch (err) {
        resultater.push({ navn: item.navn, rapportDato: item.rapportDato, gemt: false, fejl: err instanceof Error ? err.message : String(err) });
      }
    }

    return NextResponse.json({ antal: items.length, resultater });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
