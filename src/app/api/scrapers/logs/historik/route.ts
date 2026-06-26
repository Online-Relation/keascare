// src/app/api/scrapers/logs/historik/route.ts

import { NextResponse } from 'next/server';
import { hentAlleLog } from '@/lib/db/ScraperLog';

export async function GET() {
  const logs = await hentAlleLog();
  return NextResponse.json(logs);
}
