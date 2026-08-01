// src/features/pakker/services/PakkerService/pakkerService.ts

import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';

export type BeboerRegistrering = {
  id: string;
  mondayItemId: string;
  bostedNavn: string;
  pakke: string;
  aar: number;
  maaned: number;
  antalBeboere: number;
  opdateret: string | null;
};

function supabase() {
  return getSupabaseAuthBrowserClient();
}

export async function hentBeboerRegistreringer(pakke?: string): Promise<BeboerRegistrering[]> {
  let query = supabase()
    .from('pakke_beboer_registreringer')
    .select('*')
    .order('aar', { ascending: false })
    .order('maaned', { ascending: false });

  if (pakke) query = query.eq('pakke', pakke);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    mondayItemId: r.monday_item_id,
    bostedNavn: r.bosted_navn,
    pakke: r.pakke,
    aar: r.aar,
    maaned: r.maaned,
    antalBeboere: r.antal_beboere,
    opdateret: r.opdateret ?? null,
  }));
}

export async function gemBeboerRegistrering(
  mondayItemId: string,
  bostedNavn: string,
  pakke: string,
  aar: number,
  maaned: number,
  antalBeboere: number,
): Promise<void> {
  const nu = new Date().toISOString();
  const { error } = await supabase()
    .from('pakke_beboer_registreringer')
    .upsert(
      {
        monday_item_id: mondayItemId,
        bosted_navn: bostedNavn,
        pakke,
        aar,
        maaned,
        antal_beboere: antalBeboere,
        opdateret: nu,
      },
      { onConflict: 'monday_item_id,aar,maaned' },
    );
  if (error) throw error;
}
