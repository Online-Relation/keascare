// src/app/api/scrapers/ai-analyse/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { genererAiAnalyse } from '@/features/markedsdata/services/AiAnalyseService';
import { hentDstFraCache, hentDstÅrligeData } from '@/lib/api/DstClient';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret') ?? '';
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  try {
    const [cache, dstTrend] = await Promise.all([
      hentDstFraCache(),
      hentDstÅrligeData(2016).catch(() => []),
    ]);

    const analyse = await genererAiAnalyse(cache.data, dstTrend);

    return NextResponse.json({
      ok: true,
      genereret_dato: analyse.genereret_dato,
      model: analyse.model,
      tokens_brugt: analyse.tokens_brugt,
      behandlet: 1,
    });
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    return NextResponse.json({ ok: false, error: besked }, { status: 500 });
  }
}
