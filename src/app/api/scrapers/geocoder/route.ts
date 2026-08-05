// src/app/api/scrapers/geocoder/route.ts
// Geocoder alle bosteder der mangler lat/lng via DAWA

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { geocodeDawaAdresse } from '@/features/kort/services/GeocoderService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

function venteMs(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batch = Number(body.batch ?? 50);

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, tp_adresse, adresse')
    .is('lat', null)
    .not('tp_adresse', 'is', null)
    .limit(batch);

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });

  // Fallback: rækker uden tp_adresse men med adresse
  const { data: data2 } = await supabase
    .from('stps_rapporter')
    .select('id, tp_adresse, adresse')
    .is('lat', null)
    .is('tp_adresse', null)
    .not('adresse', 'is', null)
    .limit(batch - (data?.length ?? 0));

  const rækker = [...(data ?? []), ...(data2 ?? [])];

  let geocodet = 0;
  let fejl = 0;

  for (const række of rækker) {
    const adresse = (række.tp_adresse ?? række.adresse) as string;
    const koordinater = await geocodeDawaAdresse(adresse);

    if (koordinater) {
      await supabase
        .from('stps_rapporter')
        .update({ lat: koordinater.lat, lng: koordinater.lng })
        .eq('id', række.id);
      geocodet++;
    } else {
      // Marker med 0,0 så vi ikke prøver igen og igen
      await supabase
        .from('stps_rapporter')
        .update({ lat: 0, lng: 0 })
        .eq('id', række.id);
      fejl++;
    }

    await venteMs(100);
  }

  const resultat = { ok: true, geocodet, fejl, total: rækker.length };
  await logScraperKørsel('geocoder', geocodet > 0 || fejl === 0, resultat);
  return NextResponse.json(resultat);
}
