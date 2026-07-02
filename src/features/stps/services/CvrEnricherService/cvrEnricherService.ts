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

// Berig records der allerede har CVR men mangler branche/ansatte
async function berigCvrData(batch: number): Promise<CvrEnricherResultat> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, cvr')
    .not('cvr', 'is', null)
    .is('cvr_ansatte', null)
    .is('cvr_branche', null)
    .order('cvr_opdateret', { ascending: true, nullsFirst: true })
    .limit(batch);

  if (error) throw new Error(`Supabase fejl: ${error.message}`);

  const rapporter = data ?? [];
  let beriget = 0;
  let ingenMatch = 0;
  let fejl = 0;

  for (let i = 0; i < rapporter.length; i++) {
    const { id, cvr } = rapporter[i];
    if (!cvr) { ingenMatch++; continue; }

    try {
      const opslag = await slaaCvrOp(cvr);
      if (!opslag) { ingenMatch++; continue; }

      await supabase.from('stps_rapporter').update({
        cvr_ansatte: opslag.ansatte,
        cvr_branche: opslag.branche,
        cvr_virksomhedstype: opslag.virksomhedstype,
        cvr_stiftet: opslag.stiftet,
        cvr_opdateret: new Date().toISOString(),
        ...(opslag.adresse ? { adresse: opslag.adresse } : {}),
      }).eq('id', id);

      beriget++;
    } catch {
      fejl++;
    }

    if (i < rapporter.length - 1) await venteMs(1200);
  }

  return { behandlet: rapporter.length, beriget, ingenMatch, fejl };
}

// Berig records uden CVR ved at slå P-nummer op
async function berigViaPNummer(batch: number): Promise<CvrEnricherResultat> {
  const supabase = getSupabaseServerClient();

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

      const opdatering: Record<string, unknown> = {
        adresse: pOpslag.adresse,
        cvr_opdateret: new Date().toISOString(),
      };

      if (pOpslag.cvrNummer) {
        opdatering.cvr = pOpslag.cvrNummer;
        // CVR-data hentes af berigCvrData-passet næste gang jobbet kører
      }

      await supabase.from('stps_rapporter').update(opdatering).eq('id', id);
      beriget++;
    } catch {
      fejl++;
    }

    if (i < rapporter.length - 1) await venteMs(1200);
  }

  return { behandlet: rapporter.length, beriget, ingenMatch, fejl };
}

export async function berigMedCvr(batch = 25): Promise<CvrEnricherResultat> {
  // Prioriter records der allerede har CVR (kun ét API-kald pr. record)
  const cvrResultat = await berigCvrData(batch);

  // Hvis der er kvote tilbage, berig også via P-nummer
  const pBatch = Math.max(0, batch - cvrResultat.behandlet);
  let pResultat: CvrEnricherResultat = { behandlet: 0, beriget: 0, ingenMatch: 0, fejl: 0 };
  if (pBatch > 0 && cvrResultat.fejl === 0) {
    if (cvrResultat.behandlet > 0) await venteMs(2000);
    pResultat = await berigViaPNummer(pBatch);
  }

  return {
    behandlet: cvrResultat.behandlet + pResultat.behandlet,
    beriget: cvrResultat.beriget + pResultat.beriget,
    ingenMatch: cvrResultat.ingenMatch + pResultat.ingenMatch,
    fejl: cvrResultat.fejl + pResultat.fejl,
  };
}
