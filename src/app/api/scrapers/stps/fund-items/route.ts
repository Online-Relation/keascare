// src/app/api/scrapers/stps/fund-items/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { kørFundItemsScraper } from '@/features/stps/services/StpsFundItemsService';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const batch = typeof body.batch === 'number' ? body.batch : 30;

  try {
    const svar = await kørFundItemsScraper(batch);
    return NextResponse.json(svar);
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
