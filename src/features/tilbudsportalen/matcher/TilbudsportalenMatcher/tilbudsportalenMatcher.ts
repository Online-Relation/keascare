// src/features/tilbudsportalen/matcher/TilbudsportalenMatcher/tilbudsportalenMatcher.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { TilbudsportalenMatchResultat } from '@/features/tilbudsportalen/types/tilbudsportalen.types';

type TpTilbud = {
  id: number;
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
  kommune: string | null;
  tp_kommune: string | null;
};

type TpData = Omit<TpTilbud, 'navn'> & { cvr: string | null };

const STOPORD = new Set([
  'og', 'for', 'til', 'i', 'af', 'med', 'på', 'den', 'det', 'de',
  'bosted', 'bofællesskab', 'botilbud', 'bo', 'center', 'hus', 'gård',
  'stedet', 'hjemmet', 'institution', 'tilbud',
]);

export function normaliserNavn(navn: string): string {
  return navn
    .toLowerCase()
    .replace(/[.,\-–()&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normaliserKommune(kommune: string | null): string | null {
  if (!kommune) return null;
  return kommune.toLowerCase().replace(/\s+kommune$/, '').trim();
}

function kommunerMatcher(a: string | null, b: string | null): boolean {
  const na = normaliserKommune(a);
  const nb = normaliserKommune(b);
  // Hvis én af dem er null ved vi ikke kommunen — tillad ikke fuzzy match
  if (!na || !nb) return false;
  return na === nb;
}

function tokeniser(navn: string): Set<string> {
  return new Set(
    normaliserNavn(navn)
      .split(' ')
      .filter((t) => t.length > 2 && !STOPORD.has(t))
  );
}

export function fuzzyScore(navnA: string, navnB: string): number {
  const tokensA = tokeniser(navnA);
  const tokensB = tokeniser(navnB);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const fælles = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return fælles / union;
}

type KandidatMatch = { data: TpData; score: number };

function findBedsteMatch(
  stpsNavn: string,
  stpsKommune: string | null,
  cvrMap: Map<string, TpData>,
  navnMap: Map<string, { data: TpData; kommune: string | null }>,
  alle: TpTilbud[],
  stpsCvr: string | null,
): { data: TpData; kilde: string } | null {
  // 1. Eksakt CVR-match — altid sikkert, ingen kommunekrav
  if (stpsCvr) {
    const m = cvrMap.get(stpsCvr.trim());
    if (m) return { data: m, kilde: 'cvr' };
  }

  // 2. Eksakt normaliseret navnmatch + kommunekrav
  const normStps = normaliserNavn(stpsNavn);
  const eksakt = navnMap.get(normStps);
  if (eksakt && kommunerMatcher(stpsKommune, eksakt.kommune)) {
    return { data: eksakt.data, kilde: 'navn_eksakt' };
  }

  // 3. Præfiks/suffiks match + kommunekrav
  for (const [tpNavn, entry] of navnMap) {
    if (
      (tpNavn.startsWith(normStps) || normStps.startsWith(tpNavn)) &&
      kommunerMatcher(stpsKommune, entry.kommune)
    ) {
      return { data: entry.data, kilde: 'navn_præfiks' };
    }
  }

  // 4. Fuzzy token-match — kræver score >= 0.65 OG kommunematch
  let bedste: KandidatMatch | null = null;
  for (const t of alle) {
    if (!t.navn) continue;
    if (!kommunerMatcher(stpsKommune, t.kommune)) continue;
    const score = fuzzyScore(stpsNavn, t.navn);
    if (score >= 0.65 && (!bedste || score > bedste.score)) {
      bedste = {
        data: {
          id: t.id, cvr: t.cvr ?? null, tilbudstype: t.tilbudstype, pladser: t.pladser,
          p_nummer: t.p_nummer, kommune: t.kommune, kontaktperson: t.kontaktperson,
          telefon: t.telefon, email: t.email, tilbuddets_adresse: t.tilbuddets_adresse,
          leder: t.leder, website: t.website, virksomheds_navn: t.virksomheds_navn,
          tilsynsmyndighed: t.tilsynsmyndighed, pladser_pr_paragraf: t.pladser_pr_paragraf,
          driftsform: t.driftsform,
        },
        score,
      };
    }
  }
  if (bedste) return { data: bedste.data, kilde: `fuzzy_${Math.round(bedste.score * 100)}` };

  return null;
}

export async function matchTilbudsportalenTilStps(): Promise<TilbudsportalenMatchResultat> {
  const supabase = getSupabaseServerClient();

  const { data: tilbud, error: tilbudFejl } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('id, cvr, navn, tilbudstype, pladser, p_nummer, kommune, kontaktperson, telefon, email, tilbuddets_adresse, leder, website, virksomheds_navn, tilsynsmyndighed, pladser_pr_paragraf, driftsform');

  if (tilbudFejl) throw new Error(`Tilbudsportalen fejl: ${tilbudFejl.message}`);

  const alleTilbud = (tilbud ?? []) as TpTilbud[];
  const cvrMap = new Map<string, TpData>();
  const navnMap = new Map<string, { data: TpData; kommune: string | null }>();

  for (const t of alleTilbud) {
    const data: TpData = {
      id: t.id, cvr: t.cvr ?? null, tilbudstype: t.tilbudstype, pladser: t.pladser,
      p_nummer: t.p_nummer, kommune: t.kommune, kontaktperson: t.kontaktperson,
      telefon: t.telefon, email: t.email, tilbuddets_adresse: t.tilbuddets_adresse,
      leder: t.leder, website: t.website, virksomheds_navn: t.virksomheds_navn,
      tilsynsmyndighed: t.tilsynsmyndighed, pladser_pr_paragraf: t.pladser_pr_paragraf,
      driftsform: t.driftsform,
    };
    if (t.cvr) cvrMap.set(t.cvr.trim(), data);
    if (t.navn) navnMap.set(normaliserNavn(t.navn), { data, kommune: t.kommune });
  }

  const { data: rapporter, error: stpsFejl } = await supabase
    .from('stps_rapporter')
    .select('id, cvr, stps_tilbud_navn, kommune, tp_kommune');

  if (stpsFejl) throw new Error(`STPS fejl: ${stpsFejl.message}`);

  let matchet = 0;
  let ingenCvr = 0;
  let ingenMatch = 0;

  for (const rapport of (rapporter ?? []) as StpsRapport[]) {
    if (!rapport.stps_tilbud_navn) { ingenMatch++; continue; }
    if (!rapport.cvr) ingenCvr++;

    // Brug kommune fra STPS — fald tilbage til tp_kommune hvis tilgængeligt
    const stpsKommune = rapport.kommune ?? rapport.tp_kommune;

    const resultat = findBedsteMatch(
      rapport.stps_tilbud_navn,
      stpsKommune,
      cvrMap,
      navnMap,
      alleTilbud,
      rapport.cvr,
    );

    if (!resultat) { ingenMatch++; continue; }

    const { data: m } = resultat;
    await supabase
      .from('stps_rapporter')
      .update({
        ...(m.cvr && !rapport.cvr ? { cvr: m.cvr } : {}),
        tp_tilbudstype: m.tilbudstype,
        tp_pladser: m.pladser?.toString() ?? null,
        tp_p_nummer: m.p_nummer,
        tp_kommune: m.kommune,
        tp_kontaktperson: m.kontaktperson,
        tp_telefon: m.telefon,
        tp_email: m.email,
        tp_adresse: m.tilbuddets_adresse,
        tp_leder: m.leder,
        tp_website: m.website,
        tp_virksomheds_navn: m.virksomheds_navn,
        tp_tilsynsmyndighed: m.tilsynsmyndighed,
        tp_pladser_pr_paragraf: m.pladser_pr_paragraf,
        tp_driftsform: m.driftsform,
      })
      .eq('id', rapport.id);

    matchet++;
  }

  return { matchet, ingenCvr, ingenMatch };
}
