// src/app/api/scrapers/los/status/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const [{ count: total }, { count: manglerDetaljer }, { count: matchet }] = await Promise.all([
    supabase.from('los_medlemmer').select('*', { count: 'exact', head: true }),
    supabase.from('los_medlemmer').select('*', { count: 'exact', head: true }).is('scraper_dato', null),
    supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).eq('los_medlem', true),
  ]);

  return NextResponse.json({
    total: total ?? 0,
    manglerDetaljer: manglerDetaljer ?? 0,
    matchet: matchet ?? 0,
  });
}
