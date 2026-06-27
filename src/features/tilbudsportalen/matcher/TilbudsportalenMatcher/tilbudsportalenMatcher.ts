// src/features/tilbudsportalen/matcher/TilbudsportalenMatcher/tilbudsportalenMatcher.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { TilbudsportalenMatchResultat } from '@/features/tilbudsportalen/types/tilbudsportalen.types';

type TpTilbud = {
  cvr: string | null;
  navn: string | null;
  tilbudstype: string | null;
  pladser: number | null;
  p_nummer: string | null;
  kommune: string | null;
  kontaktperson: string | null;
  telefon: string | null;
  email: string | null;
  tilbuddets_adresse: string | null;
  leder: string | null;
  website: string | null;
  virksomheds_navn: string | null;
  tilsynsmyndighed: string | null;
  pladser_pr_paragraf: string | null;
  driftsform: string | null;
};

type StpsRapport = {
  id: number;
  cvr: string | null;
  stps_tilbud_navn: string | null;
};

type TpData = {
  tilbudstype: string | null;
  pladser: number | null;
  p_nummer: string | null;
  kommune: string | null;
  kontaktperson: string | null;
  telefon: string | null;
  email: string | null;
  tilbuddets_adresse: string | null;
  leder: string | null;
  website: string | null;
  virksomheds_navn: string | null;
  tilsynsmyndighed: string | null;
  pladser_pr_paragraf: string | null;
  driftsform: string | null;
};

function normaliserNavn(navn: string): string {
  return navn
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,\-–]/g, '')
    .trim();
}

function findNavnMatch(stpsNavn: string, navnMap: Map<string, TpData>): TpData | undefined {
  const normStps = normaliserNavn(stpsNavn);
  if (navnMap.has(normStps)) return navnMap.get(normStps);
  for (const [tpNavn, data] of navnMap) {
    if (tpNavn.startsWith(normStps) || normStps.startsWith(tpNavn)) {
      return data;
    }
  }
  return undefined;
}

export async function matchTilbudsportalenTilStps(): Promise<TilbudsportalenMatchResultat> {
  const supabase = getSupabaseServerClient();

  const { data: tilbud, error: tilbudFejl } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('cvr, navn, tilbudstype, pladser, p_nummer, kommune, kontaktperson, telefon, email, tilbuddets_adresse, leder, website, virksomheds_navn, tilsynsmyndighed, pladser_pr_paragraf, driftsform');

  if (tilbudFejl) throw new Error(`Tilbudsportalen fejl: ${tilbudFejl.message}`);

  const cvrMap = new Map<string, TpData>();
  const navnMap = new Map<string, TpData>();

  for (const t of (tilbud ?? []) as TpTilbud[]) {
    const data: TpData = {
      tilbudstype: t.tilbudstype,
      pladser: t.pladser,
      p_nummer: t.p_nummer,
      kommune: t.kommune,
      kontaktperson: t.kontaktperson,
      telefon: t.telefon,
      email: t.email,
      tilbuddets_adresse: t.tilbuddets_adresse,
      leder: t.leder,
      website: t.website,
      virksomheds_navn: t.virksomheds_navn,
      tilsynsmyndighed: t.tilsynsmyndighed,
      pladser_pr_paragraf: t.pladser_pr_paragraf,
      driftsform: t.driftsform,
    };
    if (t.cvr) cvrMap.set(t.cvr.trim(), data);
    if (t.navn) navnMap.set(normaliserNavn(t.navn), data);
  }

  const { data: rapporter, error: stpsFejl } = await supabase
    .from('stps_rapporter')
    .select('id, cvr, stps_tilbud_navn');

  if (stpsFejl) throw new Error(`STPS fejl: ${stpsFejl.message}`);

  let matchet = 0;
  let ingenCvr = 0;
  let ingenMatch = 0;

  for (const rapport of (rapporter ?? []) as StpsRapport[]) {
    let match: TpData | undefined;

    if (rapport.cvr) {
      match = cvrMap.get(rapport.cvr.trim());
    } else {
      ingenCvr++;
    }

    if (!match && rapport.stps_tilbud_navn) {
      match = findNavnMatch(rapport.stps_tilbud_navn, navnMap);
    }

    if (!match) { ingenMatch++; continue; }

    await supabase
      .from('stps_rapporter')
      .update({
        tp_tilbudstype: match.tilbudstype,
        tp_pladser: match.pladser?.toString() ?? null,
        tp_p_nummer: match.p_nummer,
        tp_kommune: match.kommune,
        tp_kontaktperson: match.kontaktperson,
        tp_telefon: match.telefon,
        tp_email: match.email,
        tp_adresse: match.tilbuddets_adresse,
        tp_leder: match.leder,
        tp_website: match.website,
        tp_virksomheds_navn: match.virksomheds_navn,
        tp_tilsynsmyndighed: match.tilsynsmyndighed,
        tp_pladser_pr_paragraf: match.pladser_pr_paragraf,
        tp_driftsform: match.driftsform,
      })
      .eq('id', rapport.id);

    matchet++;
  }

  return { matchet, ingenCvr, ingenMatch };
}
