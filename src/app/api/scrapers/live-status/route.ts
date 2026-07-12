// src/app/api/scrapers/live-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { hentAlleScraperStatus, opdaterScraperStatus } from '@/lib/db/ScraperStatus';

export async function GET() {
  const statuser = await hentAlleScraperStatus();
  return NextResponse.json(statuser);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { scraper_id, status, progress = 0, total = 0 } = body;
  if (!scraper_id || !status) {
    return NextResponse.json({ error: 'Mangler scraper_id eller status' }, { status: 400 });
  }
  await opdaterScraperStatus(scraper_id, status, progress, total);
  return NextResponse.json({ ok: true });
}
