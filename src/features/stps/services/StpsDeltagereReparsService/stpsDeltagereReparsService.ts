// src/features/stps/services/StpsDeltagereReparsService/stpsDeltagereReparsService.ts
//
// Genparserer tilsyn_deltagere_stps og tilsyn_deltagere_bosted for rapporter
// der mangler tilsyn_deltagere_parset_dato (= aldrig parset med nuværende parser).
// Kører som trin 14 i den daglige cron indtil alle rapporter er gennemgået.

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { parsePdfFraUrl } from '@/features/stps/scraper/StpsPdfParser';

export async function reparsDeltagere(batch = 50): Promise<{
  behandlet: number;
  succes: number;
  fejlede: number;
}> {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('stps_rapporter')
    .select('id, pdf_storage_url')
    .not('pdf_storage_url', 'is', null)
    .is('tilsyn_deltagere_parset_dato', null)
    .order('id', { ascending: true })
    .limit(batch);

  const rækker = data ?? [];
  let succes = 0;
  let fejlede = 0;

  for (const r of rækker) {
    try {
      const detaljer = await parsePdfFraUrl(r.pdf_storage_url!);
      await supabase.from('stps_rapporter').update({
        tilsyn_deltagere_stps:        detaljer.deltagereStps.length   > 0 ? detaljer.deltagereStps   : null,
        tilsyn_deltagere_bosted:      detaljer.deltagereBosted.length  > 0 ? detaljer.deltagereBosted : null,
        tilsyn_deltagere_parset_dato: new Date().toISOString(),
      }).eq('id', r.id);
      succes++;
    } catch {
      // Marker som parset selv ved fejl så vi ikke sidder fast
      await supabase.from('stps_rapporter')
        .update({ tilsyn_deltagere_parset_dato: new Date().toISOString() })
        .eq('id', r.id);
      fejlede++;
    }
  }

  return { behandlet: rækker.length, succes, fejlede };
}
