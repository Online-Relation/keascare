// src/app/api/scrapers/los/route.ts

import { NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { trin?: string; max?: number };
    const trin = body.trin ?? 'liste';
    const max = body.max ?? 100;

    if (trin === 'liste') {
      const { scraperLosListe } = await import('@/features/los/scraper/LosListScraper');
      const { items, fejl } = await scraperLosListe();
      return NextResponse.json({ ok: true, hentet: items.length, fejl });
    }

    if (trin === 'detaljer') {
      const { scraperLosDetaljer } = await import('@/features/los/scraper/LosDetaljerScraper');
      const res = await scraperLosDetaljer(max);
      return NextResponse.json({ ok: true, ...res });
    }

    if (trin === 'match') {
      const { matchLosTilBosted } = await import('@/features/los/repository/LosRepository');
      const antal = await matchLosTilBosted();
      return NextResponse.json({ ok: true, matchet: antal });
    }

    return NextResponse.json({ ok: false, fejl: 'Ukendt trin' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, fejl: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
