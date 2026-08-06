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

  // Hent bosteder der mangler koordinater:
  // - lat IS NULL = aldrig forsøgt
  // - lat = 0 = fejlede med gammel kode (0,0 er ikke en gyldig dansk adresse)
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, tp_adresse, adresse')
    .or('lat.is.null,lat.eq.0')
    .or('tp_adresse.not.is.null,adresse.not.is.null')
    .limit(batch);

  if (error) throw new Error(error.message);

  const rækker = data ?? [];

  if (rækker.length === 0) {
    const resultat = { ok: true, geocodet: 0, fejl: 0, total: 0, besked: 'Alle bosteder er geocodet' };
    await logScraperKørsel('geocoder', true, resultat);
    return resultat;
  }

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
      // Marker IKKE med 0,0 — lad lat forblive null så vi prøver igen næste kørsel
      // med en kortere adresse (fx kun by/postnr)
      const kortAdresse = udledKortAdresse(adresse);
      if (kortAdresse && kortAdresse !== adresse) {
        const koordinater2 = await geocodeDawaAdresse(kortAdresse);
        if (koordinater2) {
          await supabase
            .from('stps_rapporter')
            .update({ lat: koordinater2.lat, lng: koordinater2.lng })
            .eq('id', række.id);
          geocodet++;
          await venteMs(100);
          continue;
        }
      }
      // Sæt -1 som markering for "forsøgt men fejlet" — adskiller fra null (ikke forsøgt)
      await supabase
        .from('stps_rapporter')
        .update({ lat: -1, lng: -1 })
        .eq('id', række.id);
      fejl++;
    }

    await venteMs(100);
  }

  const resultat = { ok: true, geocodet, fejl, total: rækker.length };
  await logScraperKørsel('geocoder', true, resultat);
  return resultat;
}

// Prøv en kortere version af adressen hvis fuld adresse fejler
function udledKortAdresse(adresse: string): string | null {
  if (!adresse) return null;
  // Eksempel: "Elmevej 5, 8000 Aarhus C" → "8000 Aarhus C"
  const postnrMatch = adresse.match(/(\d{4}\s+\w.+)$/);
  if (postnrMatch) return postnrMatch[1].trim();
  // Eller: "Aarhus" fra "..., Aarhus"
  const byMatch = adresse.match(/,\s*([^,]+)$/);
  if (byMatch) return byMatch[1].trim();
  return null;
}
