// src/app/api/system/seneste-bosteder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

const PR_SIDE = 10;

export async function GET(request: NextRequest) {
  const side = parseInt(request.nextUrl.searchParams.get('side') ?? '1', 10);
  const fra = (side - 1) * PR_SIDE;

  const supabase = getSupabaseServerClient();

  const { data, count } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, scraper_dato, rapport_dato, kommune, fund_niveau', { count: 'exact' })
    .order('scraper_dato', { ascending: false, nullsFirst: false })
    .range(fra, fra + PR_SIDE - 1);

  return NextResponse.json({
    bosteder: data ?? [],
    total: count ?? 0,
    side,
    antalSider: Math.ceil((count ?? 0) / PR_SIDE),
  });
}
