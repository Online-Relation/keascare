// src/features/rapporter/services/RapporterService/rapporterService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { getVisFilter, privatFilterTpOr, privatFilterCvrOr, KOMMUNALE_DRIFTSFORMER } from '@/lib/config/GlobalFilter';
import type {
  RapporterData, RapportRække, MånedligTrend, MånedligKritisk, DriftsformKritiskStat, KommuneFundStat, TemaStat, FundNiveau,
} from '@/features/rapporter/types/rapporter.types';

// STPS-data bruges til KPI'er og grafer
type DbRapport = {
  id: string;
  stps_tilbud_navn: string;
  cvr: string | null;
  kommune: string | null;
  fund_niveau: string;
  rapport_dato: string | null;
  rapport_url: string | null;
  temaer: string[] | null;
  tp_driftsform: string | null;
  tp_tilsynsmyndighed: string | null;
  tp_tilbudstype: string | null;
  los_medlem: boolean | null;
};

// TP-data bruges som base for listen (alle bosteder)
type DbTpTilbud = {
  id: string;
  navn: string;
  cvr: string | null;
  kommune: string | null;
  tilbudstype: string | null;
  driftsform: string | null;
};

export async function hentRapporterData(fra?: string, til?: string): Promise<RapporterData> {
  const supabase = getSupabaseServerClient();
  const visFilter = await getVisFilter();

  // STPS-query til KPI'er og grafer (med datofilter)
  let stpsQuery = supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, cvr, kommune, fund_niveau, rapport_dato, rapport_url, temaer, tp_driftsform, tp_tilsynsmyndighed, tp_tilbudstype, los_medlem')
    .order('rapport_dato', { ascending: false })
    .limit(5000);

  if (visFilter === 'privat') {
    stpsQuery = stpsQuery.or(privatFilterTpOr()).or(privatFilterCvrOr());
  }

  const idag = new Date().toISOString().slice(0, 10);
  if (fra) stpsQuery = stpsQuery.gte('rapport_dato', fra);
  stpsQuery = stpsQuery.lte('rapport_dato', til ?? idag);

  // TP: Supabase returnerer maks 1000 rækker pr. request — hent i batches à 1000
  async function hentAlleTpTilbud(): Promise<DbTpTilbud[]> {
    const alle: DbTpTilbud[] = [];
    const BATCH = 1000;
    let offset = 0;
    while (true) {
      let q = supabase
        .from('tilbudsportalen_tilbud')
        .select('id, navn, cvr, kommune, tilbudstype, driftsform')
        .range(offset, offset + BATCH - 1);
      if (visFilter === 'privat') {
        q = q.not('driftsform', 'in', `(${KOMMUNALE_DRIFTSFORMER.join(',')})`);
      }
      const { data, error } = await q;
      if (error || !data || data.length === 0) break;
      alle.push(...(data as DbTpTilbud[]));
      if (data.length < BATCH) break;
      offset += BATCH;
    }
    return alle;
  }

  // Total i database til procentberegning
  let dbTotalQuery = supabase
    .from('stps_rapporter')
    .select('*', { count: 'exact', head: true });
  if (visFilter === 'privat') {
    dbTotalQuery = dbTotalQuery.or(privatFilterTpOr()).or(privatFilterCvrOr());
  }

  // LOS-CVR-liste fra los_medlemmer (scraper #1 — los.dk kilden)
  const losQuery = supabase.from('los_medlemmer').select('cvr').not('cvr', 'is', null);

  const [{ data: stpsData, error }, tpTilbudRå, { count: dbTotal }, { data: losData }] = await Promise.all([
    stpsQuery,
    hentAlleTpTilbud(),
    dbTotalQuery,
    losQuery,
  ]);

  if (error) throw new Error(`Supabase fejl: ${error.message}`);

  const alle = (stpsData ?? []) as DbRapport[];
  const tpTilbud = tpTilbudRå;
  const totalIDatabase = dbTotal ?? alle.length;
  const kritiskeMåneder = beregnKritiskeMåneder(alle);

  const losCvrSet = new Set(
    ((losData ?? []) as { cvr: string }[]).map((r) => r.cvr)
  );

  return {
    kpis:               beregnKpis(alle, totalIDatabase, kritiskeMåneder),
    trend:              beregnTrend(alle),
    kritiskeMåneder,
    driftsformKritiske: beregnDriftsformKritiske(alle),
    topKommuner:        beregnTopKommuner(alle),
    temaer:             beregnTemaer(alle),
    rapporter:          mapFraTP(tpTilbud, alle, losCvrSet),
  };
}

function beregnKpis(alle: DbRapport[], totalIDatabase: number, kritiskeMåneder: { kritisk: number }[]) {
  const grænse30 = new Date();
  grænse30.setDate(grænse30.getDate() - 30);
  const kritiske = alle.filter((r) => r.fund_niveau === 'kritisk').length;

  return {
    kritiske,
    mindreOgStørre:    alle.filter((r) => r.fund_niveau === 'mindre').length,
    ingen:             alle.filter((r) => r.fund_niveau === 'ingen').length,
    total:             alle.length,
    kritiskeSidste30:  alle.filter(
      (r) => r.fund_niveau === 'kritisk' && r.rapport_dato && new Date(r.rapport_dato) >= grænse30
    ).length,
    kritiskePct:       totalIDatabase > 0 ? Math.round((kritiske / totalIDatabase) * 100) : 0,
    totalIDatabase,
    kritiskePerMåned:  kritiskeMåneder.length > 0
      ? Math.round((kritiskeMåneder.reduce((s, m) => s + m.kritisk, 0) / kritiskeMåneder.length) * 10) / 10
      : 0,
  };
}

function beregnKritiskeMåneder(alle: DbRapport[]): MånedligKritisk[] {
  const nu = new Date();

  const datoer = alle
    .map((r) => r.rapport_dato)
    .filter(Boolean) as string[];

  const ældste = datoer.length
    ? new Date(datoer.reduce((a, b) => (a < b ? a : b)))
    : new Date(nu.getFullYear(), nu.getMonth() - 11, 1);

  const start = new Date(ældste.getFullYear(), ældste.getMonth(), 1);
  const slut = new Date(nu.getFullYear(), nu.getMonth(), 1);

  const måneder: MånedligKritisk[] = [];
  const cursor = new Date(start);
  while (cursor <= slut) {
    const nøgle = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const label = cursor.toLocaleDateString('da-DK', { month: 'short', year: '2-digit' });
    const kritisk = alle.filter((r) => r.rapport_dato?.startsWith(nøgle) && r.fund_niveau === 'kritisk').length;
    måneder.push({ måned: label, kritisk, kritiskLinje: kritisk });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return måneder;
}

function erKommunal(driftsform: string | null): boolean {
  return !!driftsform && KOMMUNALE_DRIFTSFORMER.includes(driftsform);
}

function beregnDriftsformKritiske(alle: DbRapport[]): DriftsformKritiskStat[] {
  const grupper = [
    { navn: 'Privat / selvejende', test: (r: DbRapport) => !erKommunal(r.tp_driftsform) },
    { navn: 'Kommunal / offentlig', test: (r: DbRapport) => erKommunal(r.tp_driftsform) },
  ];

  return grupper.map(({ navn, test }) => {
    const gruppe = alle.filter(test);
    const kritiske = gruppe.filter((r) => r.fund_niveau === 'kritisk').length;
    return {
      navn,
      kritiske,
      total: gruppe.length,
      pct: gruppe.length > 0 ? Math.round((kritiske / gruppe.length) * 100) : 0,
    };
  });
}

function beregnTrend(alle: DbRapport[]): MånedligTrend[] {
  const nu = new Date();
  const måneder: MånedligTrend[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(nu.getFullYear(), nu.getMonth() - i, 1);
    const år = d.getFullYear();
    const mnd = d.getMonth();
    const nøgle = `${år}-${String(mnd + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('da-DK', { month: 'short', year: '2-digit' });

    const iMåned = alle.filter((r) => r.rapport_dato?.startsWith(nøgle));
    const kritiskAntal = iMåned.filter((r) => r.fund_niveau === 'kritisk').length;
    måneder.push({
      måned:        label,
      kritisk:      kritiskAntal,
      kritiskLinje: kritiskAntal,
      mindre:       iMåned.filter((r) => r.fund_niveau === 'mindre').length,
      ingen:        iMåned.filter((r) => r.fund_niveau === 'ingen').length,
    });
  }
  return måneder;
}

function beregnTopKommuner(alle: DbRapport[]): KommuneFundStat[] {
  const map = new Map<string, KommuneFundStat>();

  for (const r of alle) {
    if (!r.kommune || r.fund_niveau === 'ingen') continue;
    if (!map.has(r.kommune)) {
      map.set(r.kommune, { kommune: r.kommune, kritisk: 0, mindre: 0, total: 0 });
    }
    const entry = map.get(r.kommune)!;
    if (r.fund_niveau === 'kritisk') entry.kritisk++;
    if (r.fund_niveau === 'mindre') entry.mindre++;
    entry.total++;
  }

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

function beregnTemaer(alle: DbRapport[]): TemaStat[] {
  const fundRapporter = alle.filter((r) => r.fund_niveau === 'kritisk' || r.fund_niveau === 'mindre');
  const tæller = new Map<string, number>();

  for (const r of fundRapporter) {
    for (const tema of r.temaer ?? []) {
      tæller.set(tema, (tæller.get(tema) ?? 0) + 1);
    }
  }

  const total = fundRapporter.length;
  return Array.from(tæller.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tema, antal]) => ({ tema, antal, pct: Math.round((antal / total) * 100) }));
}

function udledParagraf(tilbudstype: string | null): string | null {
  if (!tilbudstype) return null;
  if (tilbudstype.includes('107')) return '§107';
  if (tilbudstype.includes('108')) return '§108';
  if (tilbudstype.includes('43')) return '§43';
  return null;
}

// Byg listen fra TP-bosteder som base, beriget med seneste STPS-rapport per CVR
function mapFraTP(tpTilbud: DbTpTilbud[], stpsRapporter: DbRapport[], losCvrSet: Set<string>): RapportRække[] {
  // Byg CVR → seneste STPS-rapport map
  const cvrTilStps = new Map<string, DbRapport>();
  for (const r of stpsRapporter) {
    if (!r.cvr) continue;
    const existing = cvrTilStps.get(r.cvr);
    if (!existing || (r.rapport_dato ?? '') > (existing.rapport_dato ?? '')) {
      cvrTilStps.set(r.cvr, r);
    }
  }

  return tpTilbud.map((tp) => {
    const stps = tp.cvr ? cvrTilStps.get(tp.cvr) : undefined;
    // LOS: CVR i los_medlemmer-tabellen (scraper #1 fra los.dk) — uafhængigt af STPS
    const losmedlem = !!tp.cvr && losCvrSet.has(tp.cvr);
    return {
      id:             tp.id,
      navn:           tp.navn,
      kommune:        tp.kommune,
      fundNiveau:     (stps?.fund_niveau as FundNiveau | undefined) ?? 'ukendt',
      rapportDato:    stps?.rapport_dato ?? null,
      rapportLink:    stps?.rapport_url ?? null,
      temaer:         stps?.temaer ?? [],
      paragraf:       udledParagraf(tp.tilbudstype),
      losmedlem,
      harStpsRapport: !!stps?.rapport_url && !stps.rapport_url.startsWith('stps://genereret/'),
    };
  });
}
