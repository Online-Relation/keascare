// src/features/tilbudsportalen/repository/TilbudsportalenRepository/tilbudsportalenRepository.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { TilbudsportalenListeItem, TilbudsportalenDetalje } from '@/features/tilbudsportalen/types/tilbudsportalen.types';

// Felter vi sporer ændringer på — vises på bosteds-siden
const SPOREDE_FELTER: Array<{
  felt: keyof TilbudsportalenDetalje;
  kolonneNavn: string;
}> = [
  { felt: 'leder',                   kolonneNavn: 'leder' },
  { felt: 'pladser',                 kolonneNavn: 'pladser' },
  { felt: 'pladseTotalt',            kolonneNavn: 'pladser_totalt' },
  { felt: 'telefon',                 kolonneNavn: 'telefon' },
  { felt: 'driftsform',              kolonneNavn: 'driftsform' },
  { felt: 'aktuelGodkendelsesstatus', kolonneNavn: 'aktuel_godkendelsesstatus' },
];

export async function gemListeItems(items: TilbudsportalenListeItem[]): Promise<number> {
  const supabase = getSupabaseServerClient();

  const unikke = new Map<string, TilbudsportalenListeItem>();
  for (const item of items) unikke.set(item.afdelingsid, item);

  const rækker = Array.from(unikke.values()).map((item) => ({
    tilbudsid:          item.tilbudsid,
    afdelingsid:        item.afdelingsid,
    navn:               item.navn,
    tilbudsportalen_url: item.url,
    detaljer_hentet:    false,
    scraper_dato:       new Date().toISOString(),
  }));

  // ignoreDuplicates: true — vi opdaterer ikke eksisterende via liste-scraperens kørsel.
  // Opdatering af detaljer sker via detalje-scraperens re-queue (Nova sætter detaljer_hentet=false).
  const { error } = await supabase
    .from('tilbudsportalen_tilbud')
    .upsert(rækker, { onConflict: 'afdelingsid', ignoreDuplicates: true });

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

// Sammenlign ny og gammel værdi — returner null hvis ingen reel ændring
function normaliser(v: string | number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return String(v).trim() || null;
}

export async function gemDetaljer(detalje: TilbudsportalenDetalje): Promise<void> {
  const supabase = getSupabaseServerClient();

  // Hent eksisterende record for at sammenligne sporede felter
  const { data: eksisterende } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('leder, pladser, pladser_totalt, telefon, driftsform, aktuel_godkendelsesstatus, detaljer_hentet')
    .eq('afdelingsid', detalje.afdelingsid)
    .maybeSingle();

  // Byg ændringsliste — kun hvis record eksisterer OG har haft detaljer hentet før
  const ændringer: Array<{ afdelingsid: string; felt: string; gammel: string | null; ny: string | null }> = [];

  if (eksisterende?.detaljer_hentet) {
    const dbVærdier: Record<string, string | null> = {
      leder:                    normaliser(eksisterende.leder),
      pladser:                  normaliser(eksisterende.pladser),
      pladser_totalt:           normaliser(eksisterende.pladser_totalt),
      telefon:                  normaliser(eksisterende.telefon),
      driftsform:               normaliser(eksisterende.driftsform),
      aktuel_godkendelsesstatus: normaliser(eksisterende.aktuel_godkendelsesstatus),
    };

    for (const { felt, kolonneNavn } of SPOREDE_FELTER) {
      const gammel = dbVærdier[kolonneNavn] ?? null;
      const ny = normaliser(detalje[felt] as string | number | null);

      // Log kun faktiske ændringer (ikke null→null eller identiske værdier)
      if (gammel !== ny && !(gammel === null && ny === null)) {
        ændringer.push({ afdelingsid: detalje.afdelingsid, felt: kolonneNavn, gammel, ny });
      }
    }
  }

  // Gem ændringer i log-tabellen
  if (ændringer.length > 0) {
    await supabase.from('tilbudsportalen_aendringer').insert(
      ændringer.map((æ) => ({
        afdelingsid: æ.afdelingsid,
        felt:        æ.felt,
        gammel:      æ.gammel,
        ny:          æ.ny,
        opdaget:     new Date().toISOString(),
      }))
    );
  }

  // Opdater hoved-record med nye data
  await supabase
    .from('tilbudsportalen_tilbud')
    .update({
      cvr:                       detalje.cvr,
      tilbudstype:               detalje.tilbudstype,
      pladser:                   detalje.pladser,
      pladser_totalt:            detalje.pladseTotalt,
      p_nummer:                  detalje.pNummer,
      kommune:                   detalje.kommune,
      kontaktperson:             detalje.kontaktperson,
      telefon:                   detalje.telefon,
      email:                     detalje.email,
      driftsform:                detalje.driftsform,
      tilbuddets_adresse:        detalje.tilbuddetsAdresse,
      leder:                     detalje.leder,
      website:                   detalje.website,
      virksomheds_navn:          detalje.virksomhedsNavn,
      tilsynsmyndighed:          detalje.tilsynsmyndighed,
      pladser_pr_paragraf:       detalje.pladsePrParagraf,
      aktuel_godkendelsesstatus: detalje.aktuelGodkendelsesstatus,
      detaljer_hentet:           true,
      tp_opdateret:              new Date().toISOString(),
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

// Hent ændringshistorik for et bosted — bruges på bosteds-siden
export async function hentÆndringshistorik(afdelingsid: string) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('tilbudsportalen_aendringer')
    .select('felt, gammel, ny, opdaget')
    .eq('afdelingsid', afdelingsid)
    .order('opdaget', { ascending: false })
    .limit(50);
  return data ?? [];
}
