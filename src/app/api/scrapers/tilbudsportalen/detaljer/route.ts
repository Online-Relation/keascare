// src/app/api/scrapers/tilbudsportalen/detaljer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { scraperTilbudsportalenDetaljer } from '@/features/tilbudsportalen/scraper/TilbudsportalenDetaljerScraper';
import { matchTilbudsportalenTilStps } from '@/features/tilbudsportalen/matcher/TilbudsportalenMatcher';
import { hentAntalMangler } from '@/features/tilbudsportalen/repository/TilbudsportalenRepository';

export const maxDuration = 300;

function erAutoriseret(req: NextRequest): boolean {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) return true;
  return req.headers.get('x-scraper-secret') === secret;
}

export async function GET() {
  const mangler = await hentAntalMangler();
  return NextResponse.json({ scraper: 'tilbudsportalen-detaljer', status: 'klar', mangler });
}

export async function POST(req: NextRequest) {
  if (!erAutoriseret(req)) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { batch?: number; match?: boolean };
  const batch = Math.min(Number(body.batch ?? 30), 60);
  const kørMatch = body.match !== false;

  try {
    const detaljer = await scraperTilbudsportalenDetaljer(batch);

    let matchResultat = null;
    if (kørMatch) {
      matchResultat = await matchTilbudsportalenTilStps();
    }

    return NextResponse.json({ ok: true, ...detaljer, match: matchResultat });
  } catch (err) {
    return NextResponse.json({ ok: false, fejl: String(err) }, { status: 500 });
  }
}
