// src/features/tilbudsportalen/repository/TilbudsportalenRepository/tilbudsportalenRepository.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { TilbudsportalenListeItem, TilbudsportalenDetalje } from '@/features/tilbudsportalen/types/tilbudsportalen.types';

export async function gemListeItems(items: TilbudsportalenListeItem[]): Promise<number> {
  const supabase = getSupabaseServerClient();

  const unikke = new Map<string, TilbudsportalenListeItem>();
  for (const item of items) unikke.set(item.afdelingsid, item);

  const rækker = Array.from(unikke.values()).map((item) => ({
    tilbudsid: item.tilbudsid,
    afdelingsid: item.afdelingsid,
    navn: item.navn,
    tilbudsportalen_url: item.url,
    detaljer_hentet: false,
    scraper_dato: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('tilbudsportalen_tilbud')
    .upsert(rækker, { onConflict: 'afdelingsid', ignoreDuplicates: false });

  if (error) throw new Error(`Supabase fejl (liste): ${error.message}`);
  return rækker.length;
}

export async function hentUbehandledeAfdelinger(batch: number) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('id, tilbudsid, afdelingsid, tilbudsportalen_url, navn')
    .eq('detaljer_hentet', false)
    .limit(batch);

  if (error) throw new Error(`Supabase fejl (detaljer): ${error.message}`);
  return data ?? [];
}

export async function gemDetaljer(detalje: TilbudsportalenDetalje): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase
    .from('tilbudsportalen_tilbud')
    .update({
      cvr: detalje.cvr,
      tilbudstype: detalje.tilbudstype,
      pladser: detalje.pladser,
      p_nummer: detalje.pNummer,
      kommune: detalje.kommune,
      kontaktperson: detalje.kontaktperson,
      telefon: detalje.telefon,
      email: detalje.email,
      driftsform: detalje.driftsform,
      tilbuddets_adresse: detalje.tilbuddetsAdresse,
      leder: detalje.leder,
      website: detalje.website,
      virksomheds_navn: detalje.virksomhedsNavn,
      tilsynsmyndighed: detalje.tilsynsmyndighed,
      pladser_pr_paragraf: detalje.pladsePrParagraf,
      detaljer_hentet: true,
    })
    .eq('tilbudsid', detalje.tilbudsid)
    .eq('afdelingsid', detalje.afdelingsid);
}

export async function hentAntalMangler(): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { count } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('id', { count: 'exact', head: true })
    .eq('detaljer_hentet', false);
  return count ?? 0;
}
