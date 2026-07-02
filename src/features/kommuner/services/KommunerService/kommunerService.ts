// src/features/kommuner/services/KommunerService/kommunerService.ts

import { hentDstKommuneData } from '@/lib/api/DstClient';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { getVisFilter, driftsformFilterStreng } from '@/lib/config/GlobalFilter';
import type { KommuneOversigt, KommuneDetail, KommuneBosted } from '@/features/kommuner/types/kommuner.types';

type DbKommuneCount = {
  kommune: string;
  antal: number;
};

type DbBosted = {
  id: string;
  stps_tilbud_navn: string;
  fund_niveau: string;
  rapport_dato: string | null;
  rapport_url: string | null;
  tilsynsform: string | null;
  temaer: string[] | null;
};

export async function hentKommunerOversigt(fra?: string, til?: string): Promise<KommuneOversigt[]> {
  const [dstData, bostedTæller] = await Promise.all([
    hentDstKommuneData(),
    hentBostedAntalPrKommune(fra, til),
  ]);

  const bostedMap = new Map(bostedTæller.map((b) => [b.kommune, b.antal]));

  return dstData.map((dst) => ({
    navn: dst.kommune,
    p107: dst.p107,
    p108: dst.p108,
    totalBorgere: dst.total,
    antalBosteder: bostedMap.get(dst.kommune) ?? 0,
  }));
}

export async function hentKommuneDetail(kommuneNavn: string): Promise<KommuneDetail | null> {
  const [dstData, bosteder] = await Promise.all([
    hentDstKommuneData(),
    hentBostedForKommune(kommuneNavn),
  ]);

  const dstNavn = kommuneNavn.replace(/\s+[Kk]ommune$/, '').trim();
  const dst = dstData.find((d) => d.kommune === dstNavn || d.kommune === kommuneNavn);

  return {
    navn: kommuneNavn,
    p107: dst?.p107 ?? 0,
    p108: dst?.p108 ?? 0,
    totalBorgere: dst?.total ?? 0,
    bosteder,
  };
}

async function hentBostedAntalPrKommune(fra?: string, til?: string): Promise<DbKommuneCount[]> {
  const supabase = getSupabaseServerClient();
  const visFilter = await getVisFilter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('stps_rapporter')
    .select('kommune, tp_kommune')
    .or('tp_tilbudstype.is.null,tp_tilbudstype.ilike.%107%,tp_tilbudstype.ilike.%108%');

  if (visFilter === 'privat') query = query.not('tp_driftsform', 'in', driftsformFilterStreng());
  if (fra) query = query.gte('rapport_dato', fra);
  if (til) query = query.lte('rapport_dato', til);

  const { data } = await query;

  if (!data) return [];

  const tæller = new Map<string, number>();
  for (const row of data as { kommune: string | null; tp_kommune: string | null }[]) {
    const rå = row.kommune ?? row.tp_kommune;
    if (!rå) continue;
    // STPS gemmer "Ballerup Kommune", DST bruger "Ballerup" — strip suffix
    const nøgle = rå.replace(/\s+[Kk]ommune$/, '').trim();
    tæller.set(nøgle, (tæller.get(nøgle) ?? 0) + 1);
  }

  return Array.from(tæller.entries()).map(([kommune, antal]) => ({ kommune, antal }));
}

async function hentBostedForKommune(kommuneNavn: string): Promise<KommuneBosted[]> {
  const supabase = getSupabaseServerClient();
  const visFilter = await getVisFilter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, fund_niveau, rapport_dato, rapport_url, tilsynsform, temaer')
    .or(`kommune.eq.${kommuneNavn},tp_kommune.eq.${kommuneNavn}`)
    .or('tp_tilbudstype.is.null,tp_tilbudstype.ilike.%107%,tp_tilbudstype.ilike.%108%')
    .order('rapport_dato', { ascending: false });

  if (visFilter === 'privat') query = query.not('tp_driftsform', 'in', driftsformFilterStreng());

  const { data } = await query;

  if (!data) return [];

  return (data as DbBosted[]).map((row) => ({
    id: row.id,
    navn: row.stps_tilbud_navn,
    fundNiveau: row.fund_niveau ?? 'ukendt',
    rapportDato: row.rapport_dato,
    rapportLink: row.rapport_url,
    tilsynsform: row.tilsynsform,
    temaer: row.temaer ?? [],
  }));
}

export async function hentAlleKommuneNavne(): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  const [{ data: d1 }, { data: d2 }] = await Promise.all([
    supabase.from('stps_rapporter').select('kommune').not('kommune', 'is', null),
    supabase.from('stps_rapporter').select('tp_kommune').not('tp_kommune', 'is', null),
  ]);
  const unikke = new Set<string>();
  for (const r of (d1 ?? []) as { kommune: string }[]) unikke.add(r.kommune);
  for (const r of (d2 ?? []) as { tp_kommune: string }[]) unikke.add(r.tp_kommune);
  return [...unikke];
}
