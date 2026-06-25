// src/app/api/scrapers/stps/detaljer/route.ts

import { NextResponse } from 'next/server';
import { kørDetaljerScraper } from '@/features/stps/scraper/StpsDetaljerScraper';

export const maxDuration = 300;

export async function GET() {
  const supabase = (await import('@/lib/db/SupabaseClient')).getSupabaseServerClient();
  const { count } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .eq('pdf_behandlet', false);

  return NextResponse.json({ scraper: 'stps-detaljer', status: 'klar', mangler: count ?? 0 });
}

export async function POST(request: Request) {
  const secret = process.env.SCRAPER_SECRET;
  if (secret) {
    const auth = request.headers.get('x-scraper-secret');
    if (auth !== secret) return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { batch?: number };
  const batch = Math.min(Number(body.batch ?? 50), 100);

  try {
    const resultat = await kørDetaljerScraper(batch);
    return NextResponse.json({ ok: true, ...resultat });
  } catch (err) {
    return NextResponse.json({ ok: false, fejl: String(err) }, { status: 500 });
  }
}
