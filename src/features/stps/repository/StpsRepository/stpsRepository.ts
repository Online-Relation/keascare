// src/features/stps/repository/StpsRepository/stpsRepository.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { StpsRapportInput } from '@/features/stps/types/stps.types';

export async function upsertStpsRapport(rapport: StpsRapportInput): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  // Check if the row already exists (and fetch existing geo/type data so we don't overwrite with null)
  const { data: existing } = await supabase
    .from('stps_rapporter')
    .select('id, region, tilsynsform, kommune')
    .eq('rapport_url', rapport.rapport_url)
    .maybeSingle();

  // Bevar eksisterende geo/type-data hvis den nye scrape ikke fandt noget
  // (undgår at scraper overskriver god data med null ved midlertidig HTML-ændring på STPS)
  const regionFinal     = rapport.region     ?? existing?.region     ?? null;
  const tilsynsformFinal = rapport.tilsynsform ?? existing?.tilsynsform ?? null;
  const kommuneFinal    = rapport.kommune     ?? existing?.kommune    ?? null;

  const { error } = await supabase
    .from('stps_rapporter')
    .upsert(
      {
        stps_tilbud_navn: rapport.stps_tilbud_navn,
        rapport_titel:    rapport.rapport_titel,
        rapport_dato:     rapport.rapport_dato,
        rapport_url:      rapport.rapport_url,
        pdf_url:          rapport.pdf_url,
        stps_konklusion:  rapport.stps_konklusion,
        fund_niveau:      rapport.fund_niveau,
        fokus_omraader:   rapport.fokus_omraader,
        raa_tekst:        rapport.raa_tekst,
        kommune:          kommuneFinal,
        region:           regionFinal,
        tilsynsform:      tilsynsformFinal,
        temaer:           rapport.temaer,
        besoeg_dato:      rapport.besoegsDato ?? null,
      },
      { onConflict: 'rapport_url', ignoreDuplicates: false }
    );

  if (error) {
    console.error('[StpsRepository] upsert fejl:', error.code, error.message);
    return false;
  }

  // Return true only for genuinely new rows
  return !existing;
}

export async function opretScraperLog(kilde: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('scraper_log')
    .insert({ kilde, status: 'koerende' })
    .select('id')
    .single();

  return error ? null : data?.id ?? null;
}

export async function afslutScraperLog(
  id: string,
  status: 'succes' | 'fejl',
  antalFundet: number,
  antalNye: number,
  fejlBesked?: string
): Promise<void> {
  const supabase = getSupabaseServerClient();

  await supabase
    .from('scraper_log')
    .update({
      status,
      koersel_slut:  new Date().toISOString(),
      antal_fundet:  antalFundet,
      antal_nye:     antalNye,
      fejl_besked:   fejlBesked ?? null,
    })
    .eq('id', id);
}
