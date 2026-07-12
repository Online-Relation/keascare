// src/app/api/scrapers/fremgang/historik/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type FremgangSnapshot = {
  dato: string;
  pdf: number;
  fund: number;
  cvr: number;
  tp: number;
  pnr: number;
  total: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fra = searchParams.get('fra');
  const til = searchParams.get('til');

  const supabase = getSupabaseServerClient();

  type LogRow = { kørt_kl: string; resultat: Record<string, unknown> | null };

  let query = supabase
    .from('scraper_logs')
    .select('kørt_kl, resultat')
    .eq('scraper_id', 'fremgang-snapshot')
    .order('kørt_kl', { ascending: true });

  if (fra) {
    query = query.gte('kørt_kl', new Date(fra).toISOString());
  } else if (!fra && !til) {
    const fra14 = new Date();
    fra14.setDate(fra14.getDate() - 14);
    query = query.gte('kørt_kl', fra14.toISOString());
  }

  if (til) {
    const tilDate = new Date(til);
    tilDate.setDate(tilDate.getDate() + 1);
    query = query.lt('kørt_kl', tilDate.toISOString());
  }

  const { data } = await query;
  if (!data) return NextResponse.json([]);

  const snapshots: FremgangSnapshot[] = (data as unknown as LogRow[]).map((row) => {
    const r = (row.resultat ?? {}) as Record<string, number>;
    return {
      dato: row.kørt_kl,
      pdf:   r.pdf   ?? 0,
      fund:  r.fund  ?? 0,
      cvr:   r.cvr   ?? 0,
      tp:    r.tp    ?? 0,
      pnr:   r.pnr   ?? 0,
      total: r.total ?? 0,
    };
  });

  return NextResponse.json(snapshots);
}
