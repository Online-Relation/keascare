// src/features/stps/services/CvrAnsatteService/cvrAnsatteService.ts
// Opdaterer ansatte, branche og virksomhedstype dagligt for alle bosteder med CVR.

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { slaaCvrOp } from '@/lib/api/CvrClient';

export type CvrAnsatteResultat = {
  behandlet: number;
  opdateret: number;
  ingenData: number;
  fejl: number;
  fejlBeskeder: string[];
  førsteCvr?: string;
};

function venteMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function opdaterCvrAnsatte(batch = 100): Promise<CvrAnsatteResultat> {
  const supabase = getSupabaseServerClient();

  // Hent bosteder med CVR — prioritér dem der ikke er opdateret eller er ældst
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, cvr')
    .not('cvr', 'is', null)
    .order('cvr_opdateret', { ascending: true, nullsFirst: true })
    .limit(batch);

  if (error) throw new Error(`Supabase fejl: ${error.message}`);

  const rækker = data ?? [];
  let opdateret = 0;
  let ingenData = 0;
  let fejl = 0;
  const fejlBeskeder: string[] = [];
  const førsteCvr = rækker[0]?.cvr ?? undefined;

  for (let i = 0; i < rækker.length; i++) {
    const { id, cvr } = rækker[i];
    if (!cvr) { ingenData++; continue; }

    try {
      const opslag = await slaaCvrOp(cvr);

      if (opslag) {
        const { error: updateError } = await supabase
          .from('stps_rapporter')
          .update({
            cvr_ansatte: opslag.ansatte,
            cvr_branche: opslag.branche,
            cvr_virksomhedstype: opslag.virksomhedstype,
            cvr_stiftet: opslag.stiftet,
            cvr_opdateret: new Date().toISOString(),
          })
          .eq('id', id);
        if (updateError) {
          console.error(`Supabase update fejl for ${cvr}:`, updateError.message);
          fejl++;
        } else {
          opdateret++;
        }
      } else {
        if (fejlBeskeder.length < 3) fejlBeskeder.push(`Ingen data fra cvrapi.dk for CVR ${cvr}`);
        ingenData++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (fejlBeskeder.length < 3) fejlBeskeder.push(`Fejl for CVR ${cvr}: ${msg}`);
      console.error(`CVR opslag fejl for ${cvr}:`, e);
      fejl++;
    }

    // Respektér rate limit på cvrapi.dk (~3 req/sek)
    if (i < rækker.length - 1) await venteMs(400);
  }

  return { behandlet: rækker.length, opdateret, ingenData, fejl, fejlBeskeder, førsteCvr };
}
