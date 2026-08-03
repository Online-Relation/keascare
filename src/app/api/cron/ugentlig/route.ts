// src/app/api/cron/ugentlig/route.ts
// Ugentligt cron-job — kør søndag morgen ca. kl. 04:00.
// Sæt op i Railway Cron Service med: 0 4 * * 0
// Autentificeres med SCRAPER_SECRET headeren.
//
// Kørserækkefølge:
//   1. LOS liste        — hent alle §43/§107/§108-medlemmer fra los.dk
//   2. Monday match     — synkroniser kunder fra Monday mod STPS-bosteder

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

async function kør<T>(
  id: string,
  fn: () => Promise<T>,
  resultater: Record<string, unknown>
) {
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

  // 1. LOS — hent komplet medlemsliste fra los.dk
  await kør('los-liste', () => kald('/api/scrapers/los', { trin: 'liste' }, secret), resultater);

  // 2. Monday — synkroniser kunder
  await kør('monday-match', () => kald('/api/scrapers/monday/match', {}, secret), resultater);

  return NextResponse.json({ ok: true, kørt: new Date().toISOString(), ...resultater });
}
