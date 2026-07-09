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

export async function opdaterCvrAnsatte(batch = 200): Promise<CvrAnsatteResultat> {
  const supabase = getSupabaseServerClient();

  // Prioritér records der mangler branche/ansatte, dernæst ældst opdateret
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, cvr')
    .not('cvr', 'is', null)
    .or('cvr_ansatte.is.null,cvr_branche.is.null')
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

      if (opslag && (opslag.ansatte !== null || opslag.branche !== null || opslag.virksomhedstype !== null)) {
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
      } else if (opslag) {
        // Opslag lykkedes men ingen nyttige felter (ansatte/branche/type er alle null)
        const { error: updateError } = await supabase
          .from('stps_rapporter')
          .update({ cvr_opdateret: new Date().toISOString() })
          .eq('id', id);
        if (!updateError) opdateret++;
        else fejl++;
        if (fejlBeskeder.length < 3) fejlBeskeder.push(`CVR ${cvr}: fundet men ingen ansatte/branche data`);
      } else {
        if (fejlBeskeder.length < 3) fejlBeskeder.push(`Ingen data fra distribution.virk.dk for CVR ${cvr}`);
        ingenData++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (fejlBeskeder.length < 3) fejlBeskeder.push(`Fejl for CVR ${cvr}: ${msg}`);
      console.error(`CVR opslag fejl for ${cvr}:`, e);
      fejl++;
    }

  }

  return { behandlet: rækker.length, opdateret, ingenData, fejl, fejlBeskeder, førsteCvr };
}
