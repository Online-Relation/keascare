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
  started_at: string | null;
  updated_at: string | null;
  progress: number;
  total: number;
};

export async function hentAlleScraperStatus(): Promise<ScraperLiveStatus[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('scraper_run_status')
    .select('scraper_id, status, started_at, updated_at, progress, total');
  if (!data) return [];
  return (data as StatusRække[]).map((r) => ({
    scraperId: r.scraper_id,
    status: r.status as ScraperLiveStatus['status'],
    startetKl: r.started_at,
    opdateretKl: r.updated_at,
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
    updated_at: new Date().toISOString(),
  };
  if (status === 'kører' && progress === 0) {
    patch.started_at = new Date().toISOString();
  }
  await supabase
    .from('scraper_run_status')
    .upsert(patch, { onConflict: 'scraper_id' });
}
