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

const KØRER_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutter uden opdatering = betragtes som idle

export async function hentAlleScraperStatus(): Promise<ScraperLiveStatus[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('scraper_run_status')
    .select('scraper_id, status, started_at, updated_at, progress, total');
  if (!data) return [];

  const nu = Date.now();
  const resultat = (data as StatusRække[]).map((r) => {
    let status = r.status as ScraperLiveStatus['status'];
    if (status === 'kører' && r.updated_at) {
      const sidstOpdateret = new Date(r.updated_at).getTime();
      if (nu - sidstOpdateret > KØRER_TIMEOUT_MS) {
        status = 'idle';
      }
    }
    return {
      scraperId: r.scraper_id,
      status,
      startetKl: r.started_at,
      opdateretKl: r.updated_at,
      progress: r.progress ?? 0,
      total: r.total ?? 0,
    };
  });

  // Nulstil DB-rækker der er timed out så de ikke forbliver 'kører'
  const timedOut = (data as StatusRække[]).filter((r) => {
    if (r.status !== 'kører' || !r.updated_at) return false;
    return nu - new Date(r.updated_at).getTime() > KØRER_TIMEOUT_MS;
  });
  if (timedOut.length > 0) {
    await supabase
      .from('scraper_run_status')
      .upsert(
        timedOut.map((r) => ({ scraper_id: r.scraper_id, status: 'idle', updated_at: new Date().toISOString() })),
        { onConflict: 'scraper_id' },
      );
  }

  return resultat;
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
