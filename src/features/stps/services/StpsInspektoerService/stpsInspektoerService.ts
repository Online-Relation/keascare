// src/features/stps/services/StpsInspektoerService/stpsInspektoerService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { TilsynDeltager } from '@/features/stps/scraper/StpsPdfParser';
import type { StpsFundNiveau } from '@/features/stps/types/stps.types';
import type { InspektoerFuldStat, InspektoerRapport } from '@/features/stps/types/inspektoer.types';

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

// Ord der — uanset position — afslører et bosted/institution
const BOSTED_ORD = new Set([
  'bosted', 'botilbud', 'boltilbudet', 'boform', 'boformen', 'boligerne', 'boligcenter',
  'bofællesskab', 'bofællesskabet', 'bofælles',
  'opholdssted', 'opholdsstedet', 'opholdsted',
  'forsorgshjemmet', 'forsorgshjemme', 'forsorgshjem',
  'hjemmet', 'hjemsted',
  'institution', 'institutionen', 'inst',
  'center', 'centret', 'centeret', 'autismecenter', 'behandlingscenter',
  'kollegiet', 'kollegium',
  'herberg', 'herberget',
  'socialpsykiatrisk', 'socialpsykiatri',
  'fonden', 'foreningen',
  'huset', 'husene', 'huserne',
  'stedet', 'tilbuddet', 'tilbud',
  'behandlingsstedet', 'behandlingssted', 'behandlingshjem',
  'kvarter', 'kvarteret',
  'skolehjem', 'skolehjemmet',
  'ungdomscenter', 'ungdomshjemmet', 'ungdomscen',
  'trivselshuset',
  'progressionshuset',
  'kollektivet', 'familiekollektivet',
  'selvejende',
  'døgn', 'døgntilbud', 'døgninstitution',
  'bostøtte', 'bostøtten',
  'sporet',
  'have', 'haven',
  'villa',
  'lector', 'solutio', 'care',
  'nordbo', 'nord-bo',
  'verden',
]);

function erPersonNavn(navn: string): boolean {
  const n = navn.toLowerCase().trim();

  // Afvis hvis et af ordene i navnet matcher et bostedsord
  const ord = navn.trim().split(/\s+/);
  for (const o of ord) {
    const ol = o.toLowerCase().replace(/[^a-zæøå]/g, '');
    if (BOSTED_ORD.has(ol)) return false;
  }

  // Afvis hvis hele strengen indeholder bostedsord (inkl. sammensatte)
  if (/\b(bosted|botilbud|bofællesskab|opholdssted|forsorgshjemmet?|behandlingssted|skolehjem|bostøtte|ungdomscen|selvejende|kollektivet|døgntilbud|boltilbud)\b/.test(n)) return false;

  // Kræv mindst to ord (fornavn + efternavn)
  if (ord.length < 2) return false;

  // Kræv at første og andet ord kun indeholder bogstaver (inkl. æøå og bindestreg)
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[0])) return false;
  if (!/^[A-Za-zÆØÅæøå-]+$/.test(ord[1])) return false;

  // Afvis navne med mere end 4 ord (institutionsnavne er typisk lange)
  if (ord.length > 4) return false;

  // Afvis hvis et ord har usædvanlig indre kapitalisering (fx "BofæLlesskab")
  // Tillad kun: Ord der starter med stort + resten småt, ELLER alt småt, ELLER alt stort (initialer)
  for (const o of ord) {
    if (o.length > 2 && /[A-ZÆØÅ]/.test(o.slice(1))) return false;
  }

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
  };

  const map = new Map<string, AktumelData>();

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

    for (const d of r.tilsyn_deltagere_stps) {
      if (!erPersonNavn(d.navn)) continue;
      const nøgle = d.navn.toLowerCase().trim();
      const eks = map.get(nøgle);
      const dato = r.rapport_dato;
      if (!eks) {
        map.set(nøgle, { titel: d.titel, rapporter: [rapport], foersteDato: dato, senesteDato: dato });
      } else {
        eks.rapporter.push(rapport);
        if (dato) {
          if (!eks.foersteDato || dato < eks.foersteDato) eks.foersteDato = dato;
          if (!eks.senesteDato || dato > eks.senesteDato) eks.senesteDato = dato;
        }
      }
    }
  }

  const resultat: InspektoerFuldStat[] = [];
  for (const [nøgle, v] of map.entries()) {
    const navn = nøgle.replace(/\b\w/g, (c) => c.toUpperCase());
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
    });
  }

  return resultat.sort((a, b) => b.antal - a.antal);
}

// Legacy — bruges af gammel InspektoerOversigt
export async function hentInspektoerStatistik(): Promise<InspektoerStat[]> {
  const alle = await hentAlleInspektoerer();
  return alle.map((i) => ({ navn: i.navn, titel: i.titel, antal: i.antal, senesteDato: i.senesteDato }));
}
