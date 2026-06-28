// src/features/rapporter/services/RapporterService/rapporterService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { getVisFilter, driftsformFilterStreng } from '@/lib/config/GlobalFilter';
import type {
  RapporterData, RapportRække, MånedligTrend, KommuneFundStat, TemaStat, FundNiveau,
} from '@/features/rapporter/types/rapporter.types';

type DbRapport = {
  id: string;
  stps_tilbud_navn: string;
  kommune: string | null;
  fund_niveau: string;
  rapport_dato: string | null;
  rapport_url: string | null;
  temaer: string[] | null;
};

export async function hentRapporterData(fra?: string, til?: string): Promise<RapporterData> {
  const supabase = getSupabaseServerClient();
  const visFilter = await getVisFilter();

  let query = supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, kommune, fund_niveau, rapport_dato, rapport_url, temaer')
    .or('tp_tilbudstype.is.null,tp_tilbudstype.ilike.%107%,tp_tilbudstype.ilike.%108%')
    .order('rapport_dato', { ascending: false });

  if (visFilter === 'privat') {
    query = query.not('tp_driftsform', 'in', driftsformFilterStreng());
  }

  if (fra) query = query.gte('rapport_dato', fra);
  if (til) query = query.lte('rapport_dato', til);

  const { data, error } = await query;

  if (error) throw new Error(`Supabase fejl: ${error.message}`);

  const alle = (data ?? []) as DbRapport[];

  return {
    kpis:        beregnKpis(alle),
    trend:       beregnTrend(alle),
    topKommuner: beregnTopKommuner(alle),
    temaer:      beregnTemaer(alle),
    rapporter:   mapFundRapporter(alle),
  };
}

function beregnKpis(alle: DbRapport[]) {
  const grænse30 = new Date();
  grænse30.setDate(grænse30.getDate() - 30);

  return {
    kritiske:          alle.filter((r) => r.fund_niveau === 'kritisk').length,
    mindreOgStørre:    alle.filter((r) => r.fund_niveau === 'mindre').length,
    ingen:             alle.filter((r) => r.fund_niveau === 'ingen').length,
    total:             alle.length,
    kritiskeSidste30:  alle.filter(
      (r) => r.fund_niveau === 'kritisk' && r.rapport_dato && new Date(r.rapport_dato) >= grænse30
    ).length,
  };
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

function mapFundRapporter(alle: DbRapport[]): RapportRække[] {
  return alle.map((r) => ({
    id:          r.id,
    navn:        r.stps_tilbud_navn,
    kommune:     r.kommune,
    fundNiveau:  r.fund_niveau as FundNiveau,
    rapportDato: r.rapport_dato,
    rapportLink: r.rapport_url,
    temaer:      r.temaer ?? [],
  }));
}
