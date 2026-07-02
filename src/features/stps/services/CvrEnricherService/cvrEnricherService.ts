// src/features/stps/services/CvrEnricherService/cvrEnricherService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { slaaPNummerOp, slaaCvrOp } from '@/lib/api/CvrClient';

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
      const pOpslag = await slaaPNummerOp(pNummer);

      if (!pOpslag) { ingenMatch++; continue; }

      // Byg basalt opdaterings-objekt fra produktionsenhed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opdatering: Record<string, any> = {
        adresse: pOpslag.adresse,
        cvr_opdateret: new Date().toISOString(),
      };

      if (pOpslag.cvrNummer) {
        // Vi har CVR-nummeret — hent rige virksomhedsdata i ét ekstra kald
        opdatering.cvr = pOpslag.cvrNummer;

        await venteMs(350);
        const cvrOpslag = await slaaCvrOp(pOpslag.cvrNummer);
        if (cvrOpslag) {
          opdatering.cvr_ansatte      = cvrOpslag.ansatte;
          opdatering.cvr_branche      = cvrOpslag.branche;
          opdatering.cvr_virksomhedstype = cvrOpslag.virksomhedstype;
          opdatering.cvr_stiftet      = cvrOpslag.stiftet;
          if (!pOpslag.adresse && cvrOpslag.adresse) {
            opdatering.adresse = cvrOpslag.adresse;
          }
        }
      }

      await supabase.from('stps_rapporter').update(opdatering).eq('id', id);
      beriget++;
    } catch {
      fejl++;
    }

    if (i < rapporter.length - 1) await venteMs(400);
  }

  return { behandlet: rapporter.length, beriget, ingenMatch, fejl };
}
