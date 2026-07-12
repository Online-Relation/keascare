// src/lib/db/ScraperStatus/scraperStatus.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type ScraperLiveStatus = {
  scraperId: string;
  status: 'idle' | 'kører' | 'fejl';
  startetKl: string | null;
  opdateretKl: string | null;
  progress: number;
  total: number;
};

type StatusRække = {
  scraper_id: string;
  status: string;
  startet_kl: string | null;
  opdateret_kl: string | null;
  progress: number;
  total: number;
};

export async function hentAlleScraperStatus(): Promise<ScraperLiveStatus[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('scraper_status')
    .select('scraper_id, status, startet_kl, opdateret_kl, progress, total');
  if (!data) return [];
  return (data as StatusRække[]).map((r) => ({
    scraperId: r.scraper_id,
    status: r.status as ScraperLiveStatus['status'],
    startetKl: r.startet_kl,
    opdateretKl: r.opdateret_kl,
    progress: r.progress ?? 0,
    total: r.total ?? 0,
  }));
}

export async function opdaterScraperStatus(
  scraperId: string,
  status: ScraperLiveStatus['status'],
  progress: number,
  total: number,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const patch: Record<string, unknown> = {
    scraper_id: scraperId,
    status,
    progress,
    total,
    opdateret_kl: new Date().toISOString(),
  };
  // Sæt startet_kl kun ved første kørsel-kald
  if (status === 'kører' && progress === 0) {
    patch.startet_kl = new Date().toISOString();
  }
  await supabase
    .from('scraper_status')
    .upsert(patch, { onConflict: 'scraper_id' });
}
