// src/features/monday/services/MondaySyncService/mondaySyncService.ts
// Synkroniserer Monday-kunder til Supabase så siden kan læse hurtigt lokalt.

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { hentAlleMondayKunder } from '@/features/monday/services/MondayKunderService';

export type MondaySyncResultat = {
  hentet: number;
  upserted: number;
  fejl: number;
};

export async function synkroniserMondayKunder(): Promise<MondaySyncResultat> {
  const kunder = await hentAlleMondayKunder();
  const supabase = getSupabaseServerClient();

  let upserted = 0;
  let fejl = 0;

  const rækker = kunder.map((k) => ({
    monday_id:          k.mondayId,
    navn:               k.navn,
    gruppe:             k.gruppe,
    gruppe_navn:        k.gruppeNavn,
    adresse:            k.adresse,
    email:              k.email,
    website:            k.website,
    oprettet_dato:      k.oprettetDato ?? null,
    forloebsansvarlig:  k.forløbsansvarlig,
    opfoelgningsdato:   k.opfølgningsdato ?? null,
    afsluttet_dato:     k.afsluttetDato ?? null,
    status:             k.status,
    synkroniseret_kl:   new Date().toISOString(),
  }));

  // Upsert i batches af 100
  for (let i = 0; i < rækker.length; i += 100) {
    const batch = rækker.slice(i, i + 100);
    const { error } = await supabase
      .from('monday_kunder')
      .upsert(batch, { onConflict: 'monday_id' });

    if (error) {
      console.error('Supabase upsert fejl:', error.message);
      fejl++;
    } else {
      upserted += batch.length;
    }
  }

  return { hentet: kunder.length, upserted, fejl };
}
