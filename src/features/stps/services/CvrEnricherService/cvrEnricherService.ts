// src/features/stps/services/CvrEnricherService/cvrEnricherService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { slaaPNummerOp } from '@/lib/api/CvrClient';

export type CvrEnricherResultat = {
  behandlet: number;
  beriget: number;
  ingenMatch: number;
  fejl: number;
};

function venteMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function berigMedCvr(batch = 50): Promise<CvrEnricherResultat> {
  const supabase = getSupabaseServerClient();

  // Find rapporter uden CVR men med P-nummer (fra PDF eller Tilbudsportalen)
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, p_nummer, tp_p_nummer')
    .is('cvr', null)
    .or('p_nummer.not.is.null,tp_p_nummer.not.is.null')
    .limit(batch);

  if (error) throw new Error(`Supabase fejl: ${error.message}`);

  const rapporter = data ?? [];
  let beriget = 0;
  let ingenMatch = 0;
  let fejl = 0;

  for (let i = 0; i < rapporter.length; i++) {
    const { id, p_nummer, tp_p_nummer } = rapporter[i];
    const pNummer = p_nummer ?? tp_p_nummer;
    if (!pNummer) { ingenMatch++; continue; }

    try {
      const opslag = await slaaPNummerOp(pNummer);

      if (opslag) {
        await supabase
          .from('stps_rapporter')
          .update({ cvr: opslag.cvr, adresse: opslag.adresse })
          .eq('id', id);
        beriget++;
      } else {
        ingenMatch++;
      }
    } catch {
      fejl++;
    }

    // Respektér rate limit på cvrapi.dk (~3 req/sek)
    if (i < rapporter.length - 1) await venteMs(400);
  }

  return { behandlet: rapporter.length, beriget, ingenMatch, fejl };
}
