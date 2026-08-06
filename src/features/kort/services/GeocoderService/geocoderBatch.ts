// src/features/kort/services/GeocoderService/geocoderBatch.ts
// Geocoder batch-funktion til direkte brug i cron-job (undgår intern HTTP)

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { geocodeDawaAdresse } from './geocoderService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

function venteMs(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function kørGeocoderBatch(batch = 100): Promise<Record<string, unknown>> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, tp_adresse, adresse')
    .is('lat', null)
    .not('tp_adresse', 'is', null)
    .limit(batch);

  if (error) throw new Error(error.message);

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
      await supabase
        .from('stps_rapporter')
        .update({ lat: 0, lng: 0 })
        .eq('id', række.id);
      fejl++;
    }

    await venteMs(100);
  }

  const resultat = { ok: true, geocodet, fejl, total: rækker.length };
  await logScraperKørsel('geocoder', geocodet > 0 || rækker.length === 0, resultat);
  return resultat;
}
