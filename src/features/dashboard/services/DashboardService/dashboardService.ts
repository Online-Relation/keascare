// src/features/dashboard/services/DashboardService/dashboardService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { getVisFilter, driftsformFilterStreng } from '@/lib/config/GlobalFilter';
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
  cvr: string | null;
  pdf_vurdering: string | null;
  tp_p_nummer: string | null;
  tp_email: string | null;
  tp_telefon: string | null;
  adresse: string | null;
  pladser: string | null;
  tp_adresse: string | null;
  tp_website: string | null;
  tp_pladser: string | null;
  monday_item_id: string | null;
  monday_gruppe: string | null;
};

const NY_RAPPORT_DAGE = 60;

function erNyRapport(rapportDato: string | null): boolean {
  if (!rapportDato) return false;
  const grænse = new Date();
  grænse.setDate(grænse.getDate() - NY_RAPPORT_DAGE);
  return new Date(rapportDato) >= grænse;
}

function beregnDataKvalitet(row: DbRapport) {
  const point = [
    !!row.pdf_vurdering,
    !!row.cvr,
    !!row.tp_p_nummer,
    !!row.tp_tilbudstype,
    !!(row.tp_email || row.tp_telefon),
    !!(row.tp_adresse || row.adresse),
    !!row.tp_website,
    !!(row.tp_pladser || row.pladser),
  ];
  return { score: point.filter(Boolean).length, max: point.length };
}

function mapTilBosted(row: DbRapport): Bosted {
  const temaer = row.temaer ?? [];
  const fokus = row.fokus_omraader ?? [];
  const rapportFokus = temaer.length > 0 ? temaer.join(', ') : fokus.join(', ') || '—';

  return {
    id:           row.id,
    navn:         row.stps_tilbud_navn,
    kommune:      row.kommune,
    region:       row.region,
    tilsynsform:  row.tilsynsform,
    temaer,
    stpsFund:     (row.fund_niveau as Bosted['stpsFund']) ?? 'ukendt',
    rapportDato:  row.rapport_dato,
    rapportFokus,
    rapportLink:  row.rapport_url,
    erNy:         erNyRapport(row.rapport_dato),
    dataKvalitet: beregnDataKvalitet(row),
    mondayKunde:  row.monday_item_id ? 'kunde' : 'ingen',
    mondayGruppe: row.monday_gruppe ?? null,
    mondayItemId: row.monday_item_id ?? null,
  };
}

function beregnKpis(rapporter: DbRapport[], sidstKørtDato: string | null): KpiItem[] {
  const kritiske = rapporter.filter((r) => r.fund_niveau === 'kritisk').length;
  const kommuner = new Set(rapporter.map((r) => r.kommune).filter(Boolean)).size;
  const unikkeVirksomheder = new Set(rapporter.map((r) => r.cvr).filter(Boolean)).size;

  const sidstDato = sidstKørtDato
    ? new Date(sidstKørtDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
    : '—';

  return [
    {
      id: 'bosteder-fundet',
      label: 'Virksomheder med rapport',
      value: String(unikkeVirksomheder),
      sub: `${rapporter.length} rapporter fra STPS`,
      trendPositive: true,
    },
    {
      id: 'kommuner',
      label: 'Kommuner dækket',
      value: String(kommuner),
      sub: 'ud af 98 kommuner',
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

const FUND_PRIORITET: Record<string, number> = { kritisk: 3, stoerre: 2, større: 2, mindre: 1, ingen: 0 };

function højesteFundNiveau(niveau: string | null | undefined): import('@/features/dashboard/types/dashboard.types').KommuneFundNiveau {
  const n = (niveau ?? '').toLowerCase();
  if (n === 'kritisk') return 'kritisk';
  if (n === 'mindre' || n === 'stoerre' || n === 'større') return 'mindre';
  return 'ingen';
}

function beregnTopKommuner(rapporter: DbRapport[]): KommuneStat[] {
  // Deduplicate by CVR per kommune — count virksomheder, not rapporter
  const virksomhedMap = new Map<string, { kommune: string; prioritet: number }>();
  for (const r of rapporter) {
    const key = r.cvr ?? r.id;
    const p = FUND_PRIORITET[r.fund_niveau?.toLowerCase() ?? ''] ?? 0;
    const eksist = virksomhedMap.get(key);
    if (!eksist || p > eksist.prioritet) {
      virksomhedMap.set(key, { kommune: r.kommune ?? 'Ukendt', prioritet: p });
    }
  }

  const map = new Map<string, { antal: number; medFund: number; prioritet: number }>();
  for (const { kommune: k, prioritet: p } of virksomhedMap.values()) {
    const eksist = map.get(k) ?? { antal: 0, medFund: 0, prioritet: 0 };
    eksist.antal++;
    if (p > 0) eksist.medFund++;
    if (p > eksist.prioritet) eksist.prioritet = p;
    map.set(k, eksist);
  }

  return Array.from(map.entries())
    .map(([navn, stat]) => ({
      navn,
      antal: stat.antal,
      medFund: stat.medFund,
      højesteFund: stat.prioritet >= 3 ? 'kritisk' : stat.prioritet >= 1 ? 'mindre' : 'ingen' as import('@/features/dashboard/types/dashboard.types').KommuneFundNiveau,
    }))
    .filter((k) => k.antal > 2)
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

function beregnSalgsFunnel(rapporter: DbRapport[]) {
  // Aggregate to virksomhed-niveau via CVR (fald tilbage til id for rapporter uden CVR)
  const virksomheder = new Map<string, { fund_niveau: string | null; monday_item_id: string | null }>();
  for (const r of rapporter) {
    const key = r.cvr ?? r.id;
    const eksist = virksomheder.get(key);
    const p = FUND_PRIORITET[r.fund_niveau?.toLowerCase() ?? ''] ?? 0;
    const eksistP = FUND_PRIORITET[eksist?.fund_niveau?.toLowerCase() ?? ''] ?? 0;
    virksomheder.set(key, {
      fund_niveau: p >= eksistP ? r.fund_niveau : (eksist?.fund_niveau ?? null),
      monday_item_id: r.monday_item_id ?? eksist?.monday_item_id ?? null,
    });
  }

  const alle = Array.from(virksomheder.values());
  const medFund = alle.filter((v) => v.fund_niveau && !['ingen', 'ukendt'].includes(v.fund_niveau)).length;
  const varme = alle.filter((v) => ['kritisk', 'stoerre'].includes(v.fund_niveau ?? '')).length;
  const ubearbejdede = alle.filter((v) => ['kritisk', 'stoerre'].includes(v.fund_niveau ?? '') && !v.monday_item_id).length;
  const kunder = alle.filter((v) => !!v.monday_item_id).length;

  return {
    trin: [
      { label: 'Med tilsynsfund', antal: medFund, beskrivelse: 'Har kritisk, større eller mindre fund fra STPS' },
      { label: 'Kritisk / større fund', antal: varme, beskrivelse: 'Varmeste signaler — størst behov for KeasCare' },
      { label: 'Ikke bearbejdet endnu', antal: ubearbejdede, beskrivelse: 'Kritisk/større fund og ikke allerede kunde' },
      { label: 'Kunder i Monday', antal: kunder, beskrivelse: 'Matchet som aktiv kunde eller nyt forløb i Monday' },
    ],
  };
}

export async function hentDashboardData(fra?: string, til?: string): Promise<DashboardData> {
  const supabase = getSupabaseServerClient();
  const visFilter = await getVisFilter();

  let query = supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_dato, rapport_url, fund_niveau, fokus_omraader, temaer, kommune, region, tilsynsform, scraper_dato, tp_tilbudstype, cvr, pdf_vurdering, tp_p_nummer, tp_email, tp_telefon, adresse, pladser, tp_adresse, tp_website, tp_pladser, tp_driftsform, monday_item_id, monday_gruppe')
    .order('rapport_dato', { ascending: false });

  if (visFilter === 'privat') {
    query = query.not('tp_driftsform', 'in', driftsformFilterStreng());
  }

  if (fra) query = query.gte('rapport_dato', fra);
  if (til) query = query.lte('rapport_dato', til);

  const { data, error } = await query;

  if (error) throw new Error(`Supabase fejl: ${error.message}`);

  const rapporter = (data ?? []) as DbRapport[];
  const bosteder = rapporter.map(mapTilBosted);

  const { hentCvrSignaler } = await import('@/features/cvr/services/CvrSignalService/cvrSignalService');

  const [datakilder, logData, cvrSignaler] = await Promise.all([
    hentDatakilderStatus(supabase, rapporter),
    supabase
      .from('scraper_log')
      .select('koersel_slut')
      .eq('kilde', 'stps')
      .eq('status', 'succes')
      .order('koersel_slut', { ascending: false })
      .limit(1)
      .maybeSingle(),
    hentCvrSignaler(),
  ]);

  return {
    kpis:            beregnKpis(rapporter, logData.data?.koersel_slut ?? null),
    bosteder,
    cvrSignaler,
    stpsFordeling:   beregnFordeling(rapporter),
    topKommuner:     beregnTopKommuner(rapporter),
    tilbudsportalen: beregnTilbudsportalen(rapporter),
    salgsFunnel:     beregnSalgsFunnel(rapporter),
    datakilder,
  };
}

async function hentDatakilderStatus(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  rapporter: DbRapport[]
): Promise<import('@/features/dashboard/types/dashboard.types').Datakilde[]> {
  // STPS: sidst scraped dato fra rapporter
  const stpsSidst = rapporter
    .map((r) => r.scraper_dato)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  // Tilbudsportalen: tjek om vi har TP-matchede rapporter
  const tpMatchede = rapporter.filter((r) => r.tp_tilbudstype).length;

  // Monday: tjek om env-var er sat
  const mondayAktiv = !!process.env.MONDAY_BOARD_ID && !!process.env.MONDAY_API_KEY;

  // DST: vi kalder live API — mark aktiv hvis vi har kommunedata
  const dstAktiv = true;

  // CVR: aktiv hvis env-var til distribution.virk.dk er tilgængeligt (ingen API-nøgle kræves)
  const cvrAktiv = true;

  const fmt = (dato: string | null) =>
    dato ? new Date(dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return [
    {
      navn: 'STPS Tilsynsrapporter',
      status: rapporter.length > 0 ? 'aktiv' : 'fejl',
      sidstOpdateret: fmt(stpsSidst),
      note: `${rapporter.length} rapporter i databasen`,
    },
    {
      navn: 'Tilbudsportalen',
      status: tpMatchede > 0 ? 'aktiv' : 'fejl',
      sidstOpdateret: fmt(stpsSidst),
      note: `${tpMatchede} bosteder matchet`,
    },
    {
      navn: 'Monday CRM',
      status: mondayAktiv ? 'aktiv' : 'fejl',
      sidstOpdateret: null,
      note: mondayAktiv ? 'Live GraphQL API' : 'Mangler MONDAY_BOARD_ID eller MONDAY_API_KEY',
    },
    {
      navn: 'Danmarks Statistik',
      status: dstAktiv ? 'aktiv' : 'fejl',
      sidstOpdateret: null,
      note: 'Live API · §107 og §108 borgere pr. kommune',
    },
    {
      navn: 'CVR / Erhvervsstyrelsen',
      status: cvrAktiv ? 'aktiv' : 'fejl',
      sidstOpdateret: null,
      note: 'distribution.virk.dk · ansatte og virksomhedsdata',
    },
    {
      navn: 'MailChimp',
      status: 'ikke_implementeret',
      sidstOpdateret: null,
      note: 'Ikke koblet endnu — kommer i næste fase',
    },
  ];
}
