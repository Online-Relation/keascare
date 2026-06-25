// src/app/api/scrapers/stps/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { kørStpsScraper } from '@/features/stps/scraper/StpsScraper';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

// Simpel nøgle-beskyttelse – sæt SCRAPER_SECRET i .env.local
function erAutoriseret(request: NextRequest): boolean {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) return true; // Ingen secret sat = tillad lokalt
  const header = request.headers.get('x-scraper-secret');
  return header === secret;
}

export async function POST(request: NextRequest) {
  if (!erAutoriseret(request)) {
    return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const maxSider: number = body.maxSider ?? 3;
  const parsePdf: boolean = body.parsePdf ?? false;

  try {
    const resultat = await kørStpsScraper({ maxSider, parsePdf });
    const svar = { ok: true, fundet: resultat.fundet, nye: resultat.nye, fejl: resultat.fejl };
    await logScraperKørsel('stps-liste', true, svar);
    return NextResponse.json(svar);
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    await logScraperKørsel('stps-liste', false, { error: besked });
    return NextResponse.json({ ok: false, error: besked }, { status: 500 });
  }
}

// GET returnerer scraper-status (nyttigt til test)
export async function GET() {
  return NextResponse.json({
    scraper: 'stps',
    status: 'klar',
    brug: 'POST /api/scrapers/stps med body { maxSider: 3, parsePdf: false }',
  });
}
