// src/features/dashboard/services/DashboardService/dashboardService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { DashboardData, Bosted, KpiItem, StpsFordeling, KommuneStat } from '@/features/dashboard/types/dashboard.types';

type DbRapport = {
  id: string;
  stps_tilbud_navn: string;
  rapport_dato: string | null;
  rapport_url: string;
  fund_niveau: string;
  fokus_omraader: string[] | null;
  temaer: string[] | null;
  kommune: string | null;
  region: string | null;
  tilsynsform: string | null;
  scraper_dato: string | null;
  tp_tilbudstype: string | null;
};

const NY_RAPPORT_DAGE = 60;

function erNyRapport(rapportDato: string | null): boolean {
  if (!rapportDato) return false;
  const grænse = new Date();
  grænse.setDate(grænse.getDate() - NY_RAPPORT_DAGE);
  return new Date(rapportDato) >= grænse;
}

function mapTilBosted(row: DbRapport): Bosted {
  const temaer = row.temaer ?? [];
  const fokus = row.fokus_omraader ?? [];
  const rapportFokus = temaer.length > 0 ? temaer.join(', ') : fokus.join(', ') || '—';

  return {
    id:          row.id,
    navn:        row.stps_tilbud_navn,
    kommune:     row.kommune,
    region:      row.region,
    tilsynsform: row.tilsynsform,
    temaer,
    stpsFund:    (row.fund_niveau as Bosted['stpsFund']) ?? 'ukendt',
    rapportDato: row.rapport_dato,
    rapportFokus,
    rapportLink: row.rapport_url,
    erNy:        erNyRapport(row.rapport_dato),
  };
}

function beregnKpis(rapporter: DbRapport[]): KpiItem[] {
  const nyeSidste90 = rapporter.filter((r) => {
    if (!r.rapport_dato) return false;
    const grænse = new Date();
    grænse.setDate(grænse.getDate() - 90);
    return new Date(r.rapport_dato) >= grænse;
  }).length;

  const kritiske = rapporter.filter((r) => r.fund_niveau === 'kritisk').length;

  const kommuner = new Set(rapporter.map((r) => r.kommune).filter(Boolean)).size;

  const sidstScraped = rapporter
    .map((r) => r.scraper_dato)
    .filter(Boolean)
    .sort()
    .at(-1);

  const sidstDato = sidstScraped
    ? new Date(sidstScraped).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
    : '—';

  return [
    {
      id: 'bosteder-fundet',
      label: 'Bosteder med rapport',
      value: String(rapporter.length),
      sub: 'fra STPS tilsynsrapporter',
      trend: `${nyeSidste90} nye seneste 90 dage`,
      trendPositive: true,
    },
    {
      id: 'kommuner',
      label: 'Kommuner dækket',
      value: String(kommuner),
      sub: 'ud af 98 kommuner',
    },
    {
      id: 'nye-stps',
      label: 'Nye rapporter (90 dage)',
      value: String(nyeSidste90),
      sub: 'seneste 90 dage',
      trendPositive: true,
    },
    {
      id: 'kritiske-fund',
      label: 'Kritiske fund',
      value: String(kritiske),
      sub: 'kræver handling nu',
      trendPositive: false,
    },
    {
      id: 'sidst-opdateret',
      label: 'Sidst opdateret',
      value: sidstDato,
      sub: 'automatisk scraping',
    },
  ];
}

function beregnFordeling(rapporter: DbRapport[]): StpsFordeling[] {
  const tæller: Record<string, number> = { kritisk: 0, stoerre: 0, mindre: 0, ingen: 0, ukendt: 0 };
  for (const r of rapporter) {
    const niv = r.fund_niveau ?? 'ukendt';
    tæller[niv] = (tæller[niv] ?? 0) + 1;
  }
  const total = rapporter.length || 1;

  return [
    { label: 'Kritiske fund', antal: tæller.kritisk,  pct: Math.round((tæller.kritisk  / total) * 100) },
    { label: 'Større fund',   antal: tæller.stoerre,  pct: Math.round((tæller.stoerre  / total) * 100) },
    { label: 'Mindre fund',   antal: tæller.mindre,   pct: Math.round((tæller.mindre   / total) * 100) },
    { label: 'Ingen fund',    antal: tæller.ingen,    pct: Math.round((tæller.ingen    / total) * 100) },
  ].filter((f) => f.antal > 0);
}

function beregnTopKommuner(rapporter: DbRapport[]): KommuneStat[] {
  const map = new Map<string, { antal: number; medFund: number }>();

  for (const r of rapporter) {
    const k = r.kommune ?? 'Ukendt';
    const eksist = map.get(k) ?? { antal: 0, medFund: 0 };
    eksist.antal++;
    if (r.fund_niveau && r.fund_niveau !== 'ingen') eksist.medFund++;
    map.set(k, eksist);
  }

  return Array.from(map.entries())
    .map(([navn, stat]) => ({ navn, ...stat }))
    .sort((a, b) => b.antal - a.antal)
    .slice(0, 5);
}

function beregnTilbudsportalen(rapporter: DbRapport[]) {
  const matchede = rapporter.filter((r) => r.tp_tilbudstype);
  const total = rapporter.length;
  const dækningsgrad = total > 0 ? `${Math.round((matchede.length / total) * 100)}%` : '0%';

  const grænse30 = new Date();
  grænse30.setDate(grænse30.getDate() - 30);
  const nyeSidst = rapporter.filter(
    (r) => r.tp_tilbudstype && r.rapport_dato && new Date(r.rapport_dato) >= grænse30
  ).length;

  const senesteScraper = matchede
    .map((r) => r.scraper_dato)
    .filter(Boolean)
    .sort()
    .at(-1);
  const sidstOpdateret = senesteScraper
    ? new Date(senesteScraper).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return {
    total:   matchede.length,
    nyeSidst,
    dækningsgrad,
    sidstOpdateret,
  };
}

export async function hentDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseServerClient();

  // Kun §107, §108 og §108a — filtrerer §105 og andre irrelevante typer fra.
  // Rækker uden Tilbudsportalen-match (tp_tilbudstype IS NULL) beholdes, da vi ikke kender typen endnu.
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_dato, rapport_url, fund_niveau, fokus_omraader, temaer, kommune, region, tilsynsform, scraper_dato, tp_tilbudstype')
    .or('tp_tilbudstype.is.null,tp_tilbudstype.ilike.%107%,tp_tilbudstype.ilike.%108%')
    .order('rapport_dato', { ascending: false });

  if (error) throw new Error(`Supabase fejl: ${error.message}`);

  const rapporter = (data ?? []) as DbRapport[];
  const bosteder = rapporter.map(mapTilBosted);

  return {
    kpis:            beregnKpis(rapporter),
    bosteder,
    stpsFordeling:   beregnFordeling(rapporter),
    topKommuner:     beregnTopKommuner(rapporter),
    tilbudsportalen: beregnTilbudsportalen(rapporter),
  };
}
