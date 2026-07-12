// Henter DST HAND01 (§107/§108 borgere pr. kommune) og gemmer i dst_borgere.
// Køres kvartalsvist via cron-job.org d. 5. i januar, april, juli og oktober.

import { NextRequest, NextResponse } from 'next/server';
import { hentDstKommuneData } from '@/lib/api/DstClient';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

export async function POST(req: NextRequest) {
  const secret = process.env.SCRAPER_SECRET;
  if (secret) {
    const auth = req.headers.get('x-scraper-secret');
    if (auth !== secret) return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  try {
    const data = await hentDstKommuneData();
    if (!data.length) {
      return NextResponse.json({ ok: false, fejl: 'Ingen data fra DST' }, { status: 502 });
    }

    // Udtræk kvartal fra første række (DstClient sætter det på objektet)
    const kvartal = (data[0] as { kvartal?: string }).kvartal ?? beregnAktuelKvartal();

    const supabase = getSupabaseServerClient();

    const rækker = data.map((k) => ({
      kvartal,
      kommune: k.kommune,
      p107:    k.p107,
      p108:    k.p108,
      total:   k.total,
      hentet_kl: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('dst_borgere')
      .upsert(rækker, { onConflict: 'kvartal,kommune', ignoreDuplicates: false });

    if (error) throw new Error(error.message);

    await logScraperKørsel('dst', true, { ok: true, kvartal, kommuner: data.length });
    return NextResponse.json({ ok: true, kvartal, kommuner: data.length });
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    await logScraperKørsel('dst', false, { error: besked });
    return NextResponse.json({ ok: false, fejl: besked }, { status: 500 });
  }
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('dst_borgere')
    .select('kvartal, hentet_kl')
    .order('hentet_kl', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    scraper: 'dst',
    sidstHentet: data?.hentet_kl ?? null,
    senesteKvartal: data?.kvartal ?? null,
    næsteKørsel: 'Kvartalsvist: 5. jan, 5. apr, 5. jul, 5. okt',
  });
}

function beregnAktuelKvartal(): string {
  const nu = new Date();
  const år = nu.getFullYear();
  const kvartal = Math.ceil((nu.getMonth() + 1) / 3);
  return `${år}K${kvartal}`;
}
