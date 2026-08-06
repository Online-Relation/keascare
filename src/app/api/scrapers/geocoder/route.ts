// src/app/api/scrapers/geocoder/route.ts
// Manuel kørsel af geocoder — cron bruger geocoderBatch direkte

import { NextRequest, NextResponse } from 'next/server';
import { kørGeocoderBatch } from '@/features/kort/services/GeocoderService/geocoderBatch';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batch = Number(body.batch ?? 100);

  try {
    const resultat = await kørGeocoderBatch(batch);
    return NextResponse.json(resultat);
  } catch (err) {
    return NextResponse.json({ ok: false, fejl: String(err) }, { status: 500 });
  }
}
