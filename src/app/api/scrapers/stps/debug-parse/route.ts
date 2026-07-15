// src/app/api/scrapers/stps/debug-parse/route.ts
// Returnerer hvad scraper'en præcis parser fra STPS side 1 — bruges til fejlsøgning

import { NextResponse } from 'next/server';
import { scraperListeSider } from '@/features/stps/scraper/StpsListScraper';

export async function GET() {
  try {
    const items = await scraperListeSider(1);
    return NextResponse.json({
      antal: items.length,
      items: items.map((it) => ({
        navn: it.navn,
        rapportDato: it.rapportDato,
        besoegsDato: it.besoegsDato,
        detailUrl: it.detailUrl,
        tags: it.tags,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
