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

  // Kør i baggrunden — STPS har ~92 sider (~920 rapporter), tager ~90 sek.
  // Returnerer straks så browseren ikke timeout'er.
  kørIBaggrunden().catch(() => {});

  return NextResponse.json({
    ok: true,
    besked: 'Kørsel startet — henter alle STPS-sider i baggrunden (~1-2 min)',
    kørt: new Date().toISOString(),
  });
}

async function kørIBaggrunden() {
  try {
    const resultat = await kørStpsScraper({ maxSider: 100 });
    await logScraperKørsel('stps-liste', true, {
      fundet: resultat.fundet,
      nye: resultat.nye,
      fejl: resultat.fejl.length,
    });
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    await logScraperKørsel('stps-liste', false, { error: besked });
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
