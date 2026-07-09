// src/features/stps/services/RegnskabService/regnskabService.ts
// Henter årsregnskab for bosteder med CVR og gemmer nøgletal i stps_rapporter.

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { hentRegnskab } from '@/lib/api/RegnskabClient';

export type RegnskabResultat = {
  behandlet: number;
  opdateret: number;
  ingenData: number;
  fejl: number;
  fejlBeskeder: string[];
};

function venteMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function opdaterRegnskab(batch = 50): Promise<RegnskabResultat> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, cvr')
    .not('cvr', 'is', null)
    .or('regnskab_aar.is.null,regnskab_opdateret.lt.' + nyligGraense())
    .order('regnskab_opdateret', { ascending: true, nullsFirst: true })
    .limit(batch);

  if (error) throw new Error(`Supabase fejl: ${error.message}`);

  const rækker = data ?? [];
  let opdateret = 0;
  let ingenData = 0;
  let fejl = 0;
  const fejlBeskeder: string[] = [];

  for (let i = 0; i < rækker.length; i++) {
    const { id, cvr } = rækker[i];
    if (!cvr) { ingenData++; continue; }

    try {
      const regnskab = await hentRegnskab(cvr);

      if (!regnskab) {
        await supabase
          .from('stps_rapporter')
          .update({ regnskab_opdateret: new Date().toISOString() })
          .eq('id', id);
        ingenData++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('stps_rapporter')
        .update({
          regnskab_aar:            regnskab.regnskabsaar,
          regnskab_periode_start:  regnskab.periodeStart,
          regnskab_periode_slut:   regnskab.periodeSlut,
          regnskab_nettoomsaetning: regnskab.nettoomsaetning,
          regnskab_bruttofortjeneste: regnskab.bruttofortjeneste,
          regnskab_aarsresultat:   regnskab.aarsresultat,
          regnskab_egenkapital:    regnskab.egenkapital,
          regnskab_balance:        regnskab.balance,
          regnskab_opdateret:      new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        if (fejlBeskeder.length < 3) fejlBeskeder.push(`Supabase fejl for CVR ${cvr}: ${updateError.message}`);
        fejl++;
      } else {
        opdateret++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (fejlBeskeder.length < 3) fejlBeskeder.push(`Fejl for CVR ${cvr}: ${msg}`);
      fejl++;
      await supabase
        .from('stps_rapporter')
        .update({ regnskab_opdateret: new Date().toISOString() })
        .eq('id', id);
    }

    if (i < rækker.length - 1) await venteMs(300);
  }

  return { behandlet: rækker.length, opdateret, ingenData, fejl, fejlBeskeder };
}

function nyligGraense(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString();
}
