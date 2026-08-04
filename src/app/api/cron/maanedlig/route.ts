// src/app/api/cron/maanedlig/route.ts
// Månedligt cron-job — kør den 1. i måneden kl. 03:00.
// Sæt op i Railway Cron Service med: 0 3 1 * *
// Autentificeres med SCRAPER_SECRET headeren.
//
// Kørserækkefølge:
//   1. AI-analyse — genererer månedlig markedsanalyse med Claude

import { NextRequest, NextResponse } from 'next/server';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

async function kald(endpoint: string, body: Record<string, unknown>, secret: string): Promise<Record<string, unknown>> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-scraper-secret': secret },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function kør<T>(id: string, fn: () => Promise<T>, resultater: Record<string, unknown>) {
  try {
    const res = await fn();
    resultater[id] = res;
    await logScraperKørsel(id, true, res as Record<string, unknown>);
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    resultater[id] = { fejl: besked };
    await logScraperKørsel(id, false, { error: besked });
  }
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret') ?? '';
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const resultater: Record<string, unknown> = {};

  await kør('ai-analyse', () => kald('/api/scrapers/ai-analyse', {}, secret), resultater);

  return NextResponse.json({ ok: true, kørt: new Date().toISOString(), ...resultater });
}
