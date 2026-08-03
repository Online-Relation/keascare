// src/features/stps/services/StpsInspektoerService/stpsInspektoerService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { TilsynDeltager } from '@/features/stps/scraper/StpsPdfParser';
import type { StpsFundNiveau } from '@/features/stps/types/stps.types';
import type { InspektoerFuldStat, InspektoerKollega, InspektoerRapport } from '@/features/stps/types/inspektoer.types';

// Kept for backwards-compat with old component
export type InspektoerStat = {
  navn: string;
  titel: string | null;
  antal: number;
  senesteDato: string | null;
};

type DbRapport = {
  id: string;
  stps_tilbud_navn: string;
  rapport_dato: string | null;
  rapport_url: string;
  pdf_storage_url: string | null;
  fund_niveau: string | null;
  temaer: string[] | null;
  kommune: string | null;
  region: string | null;
  tilsynsform: string | null;
  tilsyn_deltagere_stps: TilsynDeltager[] | null;
};

// Suffikser/præfikser der — som del af et sammensat ord — afslører et bosted
const BOSTED_SUFFIKSER = [
  'hjemmet', 'hjemme', 'hjem',
  'center', 'centret', 'centeret',
  'kollegiet', 'kollegium',
  'tilbuddet', 'tilbuddene', 'tilbud',
  'stedet', 'sted',
  'huset', 'husene', 'huserne',
  'gården',
  'hjemsted',
  'bofællesskab', 'bofælles',
  'boform', 'bolig', 'bosted', 'botilbud',
  'boenhed', 'boenheden',
  'institution', 'institutionen',
  'behandling', 'behandlings',
  'ungdoms', 'børne',
  'omsorg', 'omsorgs',
  'skolehjem',
  'bostøtte',
  'forsorgshjem', 'forsorgs',
  'socialpsykia',
  'enhed', 'enheden',
  'bakken',
  'pensionat', 'pensionatet',
];

// Hele ord der afslører et bosted/institution
const BOSTED_HELE_ORD = new Set([
  'opholdssted', 'opholdsstedet', 'opholdsted',
  'herberg', 'herberget',
  'fonden', 'foreningen',
  'kvarter', 'kvarteret',
  'selvejende', 'inst',
  'døgn',
  'sporet', 'villa',
  'lector', 'solutio', 'care',
  'nord-bo', 'nordbo',
  'verden',
  'vej', 'alle', 'boulevard', 'stræde', 'plads',
  'omsorg',
  'hus',
  'have', 'haven',
  'bakken',
]);

function erPersonNavn(navn: string): boolean {
  const n = navn.toLowerCase().trim();
  const ord = navn.trim().split(/\s+/);

  // Kræv mindst to ord (fornavn + efternavn)
  if (ord.length < 2) return false;

  // Kræv at første og andet ord kun indeholder bogstaver (inkl. æøå og bindestreg)
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[0])) return false;
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[1])) return false;

  // Afvis navne med mere end 4 ord (institutionsnavne er typisk lange)
  if (ord.length > 4) return false;

  // Afvis hvis et ord har usædvanlig indre kapitalisering (fx "BofæLlesskab", "RøDland")
  // Tillad kapital efter bindestreg i sammensatte fornavne (Ann-Christina, Mary-Ann)
  for (const o of ord) {
    const udenBindestreg = o.replace(/-[A-ZÆØÅa-zæøå]/g, '');
    if (udenBindestreg.length > 2 && /[A-ZÆØÅ]/.test(udenBindestreg.slice(1))) return false;
  }

  // Tjek hvert ord for bosted-indikatorer
  for (const o of ord) {
    const ol = o.toLowerCase().replace(/[^a-zæøå]/g, '');

    // Eksakt match på hele ord
    if (BOSTED_HELE_ORD.has(ol)) return false;

    // Indeholder et bosted-suffiks/præfiks (sammensatte ord)
    if (BOSTED_SUFFIKSER.some((s) => ol.includes(s))) return false;
  }

  // Tjek hele den sammensatte streng (fanger fx "særlige boliger")
  if (/\b(bolig|bofæl|botilbud|bosted|behandling|omsorg|selvejende|ungdoms|forsorg|socialpsykia)\b/.test(n)) return false;

  return true;
}

export function navnTilSlug(navn: string): string {
  return navn
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function hentAlleInspektoerer(): Promise<InspektoerFuldStat[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_dato, rapport_url, pdf_storage_url, fund_niveau, temaer, kommune, region, tilsynsform, tilsyn_deltagere_stps')
    .not('tilsyn_deltagere_stps', 'is', null);

  if (error || !data) return [];

  type AktumelData = {
    titel: string | null;
    rapporter: InspektoerRapport[];
    foersteDato: string | null;
    senesteDato: string | null;
    rapportIds: Set<string>;
  };

  const map = new Map<string, AktumelData>();
  // rapport-id → liste af inspektør-nøgler på det tilsyn
  const rapportDeltagere = new Map<string, string[]>();

  for (const r of data as DbRapport[]) {
    if (!r.tilsyn_deltagere_stps) continue;
    const fundNiveau = (r.fund_niveau ?? 'ukendt') as StpsFundNiveau;
    const rapport: InspektoerRapport = {
      id: r.id,
      bostedNavn: r.stps_tilbud_navn,
      dato: r.rapport_dato,
      fundNiveau,
      temaer: r.temaer ?? [],
      kommune: r.kommune,
      region: r.region,
      rapportUrl: r.pdf_storage_url ?? r.rapport_url,
      pdfStorageUrl: r.pdf_storage_url,
      tilsynsform: r.tilsynsform,
    };

    const deltagendeNøgler: string[] = [];
    for (const d of r.tilsyn_deltagere_stps) {
      if (!erPersonNavn(d.navn)) continue;
      const nøgle = d.navn.toLowerCase().trim();
      deltagendeNøgler.push(nøgle);
      const eks = map.get(nøgle);
      const dato = r.rapport_dato;
      if (!eks) {
        map.set(nøgle, { titel: d.titel, rapporter: [rapport], foersteDato: dato, senesteDato: dato, rapportIds: new Set([r.id]) });
      } else {
        eks.rapporter.push(rapport);
        eks.rapportIds.add(r.id);
        if (dato) {
          if (!eks.foersteDato || dato < eks.foersteDato) eks.foersteDato = dato;
          if (!eks.senesteDato || dato > eks.senesteDato) eks.senesteDato = dato;
        }
      }
    }
    if (deltagendeNøgler.length > 1) rapportDeltagere.set(r.id, deltagendeNøgler);
  }

  // Byg kollega-tæller: for hvert rapport med >1 deltager, kryds alle deltagere
  const kollegaTæller = new Map<string, Map<string, number>>();
  for (const deltagere of rapportDeltagere.values()) {
    for (let i = 0; i < deltagere.length; i++) {
      for (let j = 0; j < deltagere.length; j++) {
        if (i === j) continue;
        const a = deltagere[i], b = deltagere[j];
        if (!kollegaTæller.has(a)) kollegaTæller.set(a, new Map());
        const m = kollegaTæller.get(a)!;
        m.set(b, (m.get(b) ?? 0) + 1);
      }
    }
  }

  const resultat: InspektoerFuldStat[] = [];
  for (const [nøgle, v] of map.entries()) {
    // Split på mellemrum for at undgå at \b\w kapitaliserer forkert efter æøå
    const navn = nøgle.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const bosteder = [...new Set(v.rapporter.map((r) => r.bostedNavn))];

    const kommunerSet = new Set<string>();
    for (const r of v.rapporter) {
      if (r.kommune) kommunerSet.add(r.kommune);
      else if (r.region) kommunerSet.add(r.region);
    }

    const antalMedFund = v.rapporter.filter((r) => r.fundNiveau !== 'ingen').length;
    const antalKritiske = v.rapporter.filter((r) => r.fundNiveau === 'kritisk').length;

    const temaMap = new Map<string, number>();
    for (const r of v.rapporter) {
      for (const t of r.temaer) {
        temaMap.set(t, (temaMap.get(t) ?? 0) + 1);
      }
    }
    const mesteFund = [...temaMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tema, antal]) => ({ tema, antal }));

    const kolleger: InspektoerKollega[] = [...(kollegaTæller.get(nøgle) ?? new Map()).entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([kollegaNøgle, antalSammen]) => {
        const kollegaNavn = kollegaNøgle.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return {
          navn: kollegaNavn,
          slug: navnTilSlug(kollegaNavn),
          titel: map.get(kollegaNøgle)?.titel ?? null,
          antalSammen,
        };
      });

    resultat.push({
      navn,
      slug: navnTilSlug(navn),
      titel: v.titel,
      antal: v.rapporter.length,
      bosteder,
      kommuner: [...kommunerSet],
      antalMedFund,
      antalKritiske,
      mesteFund,
      senesteDato: v.senesteDato,
      foersteDato: v.foersteDato,
      rapporter: v.rapporter.sort((a, b) => (b.dato ?? '').localeCompare(a.dato ?? '')),
      kolleger,
    });
  }

  return resultat.sort((a, b) => b.antal - a.antal);
}

// Legacy — bruges af gammel InspektoerOversigt
export async function hentInspektoerStatistik(): Promise<InspektoerStat[]> {
  const alle = await hentAlleInspektoerer();
  return alle.map((i) => ({ navn: i.navn, titel: i.titel, antal: i.antal, senesteDato: i.senesteDato }));
}
