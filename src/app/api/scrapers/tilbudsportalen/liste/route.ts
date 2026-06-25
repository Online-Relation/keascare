// src/app/api/scrapers/tilbudsportalen/liste/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { scraperTilbudsportalenListe } from '@/features/tilbudsportalen/scraper/TilbudsportalenListScraper';
import { hentAntalMangler } from '@/features/tilbudsportalen/repository/TilbudsportalenRepository';

export const maxDuration = 300;

function erAutoriseret(req: NextRequest): boolean {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) return true;
  return req.headers.get('x-scraper-secret') === secret;
}

export async function GET() {
  const mangler = await hentAntalMangler();
  return NextResponse.json({ scraper: 'tilbudsportalen-liste', status: 'klar', mangler });
}

export async function POST(req: NextRequest) {
  if (!erAutoriseret(req)) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { maxSider?: number };
  const maxSider = Math.min(Number(body.maxSider ?? 50), 100);

  try {
    const resultat = await scraperTilbudsportalenListe(maxSider);
    return NextResponse.json({ ok: true, ...resultat });
  } catch (err) {
    return NextResponse.json({ ok: false, fejl: String(err) }, { status: 500 });
  }
}
