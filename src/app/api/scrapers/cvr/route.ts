// src/app/api/scrapers/cvr/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { berigMedCvr } from '@/features/stps/services/CvrEnricherService';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const batch = typeof body.batch === 'number' ? body.batch : 50;

    const resultat = await berigMedCvr(batch);
    return NextResponse.json({ ok: true, ...resultat });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Ukendt fejl' },
      { status: 500 }
    );
  }
}
