// src/app/api/scrapers/logs/route.ts

import { NextResponse } from 'next/server';
import { hentSenesteLog } from '@/lib/db/ScraperLog';

export async function GET() {
  const logs = await hentSenesteLog();
  return NextResponse.json(logs);
}
