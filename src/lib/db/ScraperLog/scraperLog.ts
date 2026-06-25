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

export async function hentSenesteLog(): Promise<ScraperLog[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('scraper_logs')
    .select('scraper_id, ok, kørt_kl, resultat')
    .order('kørt_kl', { ascending: false })
    .limit(200);

  if (!data) return [];

  // Én post per scraper_id — den seneste
  const seneste = new Map<string, ScraperLog>();
  for (const row of data) {
    if (!seneste.has(row.scraper_id)) {
      seneste.set(row.scraper_id, {
        scraperId: row.scraper_id,
        ok: row.ok,
        kørtKl: row.kørt_kl,
        resultat: row.resultat as Record<string, unknown> | null,
      });
    }
  }
  return Array.from(seneste.values());
}
