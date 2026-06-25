// src/app/api/scrapers/stps/pnummer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { parsePdfFraUrl } from '@/features/stps/scraper/StpsPdfParser';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

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

  // Find rapporter med pdf_url men uden p_nummer
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, pdf_url')
    .is('p_nummer', null)
    .not('pdf_url', 'is', null)
    .limit(batch);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rapporter = data ?? [];
  let fundet = 0;
  let ingenPNummer = 0;
  let fejl = 0;

  for (let i = 0; i < rapporter.length; i++) {
    const { id, stps_tilbud_navn, pdf_url } = rapporter[i];
    try {
      const detaljer = await parsePdfFraUrl(pdf_url!);

      if (detaljer.pNummer) {
        await supabase
          .from('stps_rapporter')
          .update({ p_nummer: detaljer.pNummer })
          .eq('id', id);
        fundet++;
      } else {
        ingenPNummer++;
      }
    } catch {
      fejl++;
    }

    if (i < rapporter.length - 1) await venteMs(400);
  }

  const svar = { ok: true, behandlet: rapporter.length, fundet, ingenPNummer, fejl };
  await logScraperKørsel('stps-pnummer', true, svar);
  return NextResponse.json(svar);
}
