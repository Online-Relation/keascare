// src/app/api/scrapers/stps/fund-items/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { parsePdfFraUrl } from '@/features/stps/scraper/StpsPdfParser';

function venteMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const batch = typeof body.batch === 'number' ? body.batch : 50;

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, pdf_url')
    .is('fund_items', null)
    .not('pdf_url', 'is', null)
    .limit(batch);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const rapporter = data ?? [];
  let fundet = 0;
  let ingenItems = 0;
  let fejl = 0;

  for (let i = 0; i < rapporter.length; i++) {
    const { id, pdf_url } = rapporter[i];
    try {
      const detaljer = await parsePdfFraUrl(pdf_url!);
      if (detaljer.fundItems.length > 0) {
        await supabase
          .from('stps_rapporter')
          .update({ fund_items: detaljer.fundItems })
          .eq('id', id);
        fundet++;
      } else {
        await supabase
          .from('stps_rapporter')
          .update({ fund_items: [] })
          .eq('id', id);
        ingenItems++;
      }
    } catch {
      fejl++;
    }
    if (i < rapporter.length - 1) await venteMs(400);
  }

  return NextResponse.json({ ok: true, behandlet: rapporter.length, fundet, ingenItems, fejl });
}
