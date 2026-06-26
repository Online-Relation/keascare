// src/lib/db/ScraperLog/scraperLog.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function logScraperKørsel(
  scraperId: string,
  ok: boolean,
  resultat: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getSupabaseServerClient();
    await supabase.from('scraper_logs').insert({ scraper_id: scraperId, ok, resultat });
  } catch {
    // Log-fejl må ikke crashe scrapers
  }
}

export type ScraperLog = {
  scraperId: string;
  ok: boolean;
  kørtKl: string;
  resultat: Record<string, unknown> | null;
};

export type ScraperLogHistorik = {
  id: number;
  scraperId: string;
  ok: boolean;
  kørtKl: string;
  resultat: Record<string, unknown> | null;
};

export async function hentAlleLog(): Promise<ScraperLogHistorik[]> {
  const supabase = getSupabaseServerClient();
  type LogRække = { id: number; scraper_id: string; ok: boolean; kørt_kl: string; resultat: Record<string, unknown> | null };

  const { data } = await supabase
    .from('scraper_logs')
    .select('id, scraper_id, ok, kørt_kl, resultat')
    .order('kørt_kl', { ascending: true })
    .limit(500);

  if (!data) return [];

  return (data as unknown as LogRække[]).map((row) => ({
    id: row.id,
    scraperId: row.scraper_id,
    ok: row.ok,
    kørtKl: row.kørt_kl,
    resultat: row.resultat,
  }));
}

export async function hentSenesteLog(): Promise<ScraperLog[]> {
  const supabase = getSupabaseServerClient();
  type LogRække = { scraper_id: string; ok: boolean; kørt_kl: string; resultat: Record<string, unknown> | null };

  const { data } = await supabase
    .from('scraper_logs')
    .select('scraper_id, ok, kørt_kl, resultat')
    .order('kørt_kl', { ascending: false })
    .limit(200);

  if (!data) return [];

  const rækker = data as unknown as LogRække[];
  const seneste = new Map<string, ScraperLog>();
  for (const row of rækker) {
    if (!seneste.has(row.scraper_id)) {
      seneste.set(row.scraper_id, {
        scraperId: row.scraper_id,
        ok: row.ok,
        kørtKl: row.kørt_kl,
        resultat: row.resultat,
      });
    }
  }
  return Array.from(seneste.values());
}
