// src/features/kommuner/services/KommunerService/kommunerService.ts

import { hentDstKommuneData } from '@/lib/api/DstClient';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
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

export async function hentKommunerOversigt(): Promise<KommuneOversigt[]> {
  const [dstData, bostedTæller] = await Promise.all([
    hentDstKommuneData(),
    hentBostedAntalPrKommune(),
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

  const dst = dstData.find((d) => d.kommune === kommuneNavn);

  return {
    navn: kommuneNavn,
    p107: dst?.p107 ?? 0,
    p108: dst?.p108 ?? 0,
    totalBorgere: dst?.total ?? 0,
    bosteder,
  };
}

async function hentBostedAntalPrKommune(): Promise<DbKommuneCount[]> {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('stps_rapporter')
    .select('kommune')
    .or('tp_tilbudstype.is.null,tp_tilbudstype.ilike.%107%,tp_tilbudstype.ilike.%108%')
    .not('kommune', 'is', null);

  if (!data) return [];

  const tæller = new Map<string, number>();
  for (const row of data as { kommune: string }[]) {
    tæller.set(row.kommune, (tæller.get(row.kommune) ?? 0) + 1);
  }

  return Array.from(tæller.entries()).map(([kommune, antal]) => ({ kommune, antal }));
}

async function hentBostedForKommune(kommuneNavn: string): Promise<KommuneBosted[]> {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, fund_niveau, rapport_dato, rapport_url, tilsynsform, temaer')
    .eq('kommune', kommuneNavn)
    .or('tp_tilbudstype.is.null,tp_tilbudstype.ilike.%107%,tp_tilbudstype.ilike.%108%')
    .order('rapport_dato', { ascending: false });

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
