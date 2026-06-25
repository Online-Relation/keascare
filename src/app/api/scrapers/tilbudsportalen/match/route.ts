// src/app/api/scrapers/tilbudsportalen/match/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { matchTilbudsportalenTilStps } from '@/features/tilbudsportalen/matcher/TilbudsportalenMatcher';

export const maxDuration = 120;

function erAutoriseret(req: NextRequest): boolean {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) return true;
  return req.headers.get('x-scraper-secret') === secret;
}

export async function POST(req: NextRequest) {
  if (!erAutoriseret(req)) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }
  try {
    const resultat = await matchTilbudsportalenTilStps();
    return NextResponse.json({ ok: true, ...resultat });
  } catch (err) {
    return NextResponse.json({ ok: false, fejl: String(err) }, { status: 500 });
  }
}
