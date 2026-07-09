// src/app/api/scrapers/tilbudsportalen/status/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const [{ count: total }, { count: mangler }, { count: matchet }] = await Promise.all([
    supabase.from('tilbudsportalen_tilbud').select('*', { count: 'exact', head: true }),
    supabase.from('tilbudsportalen_tilbud').select('*', { count: 'exact', head: true }).eq('detaljer_hentet', false),
    supabase.from('tilbudsportalen_tilbud').select('*', { count: 'exact', head: true }).not('stps_rapport_id', 'is', null),
  ]);

  return NextResponse.json({
    total: total ?? 0,
    mangler: mangler ?? 0,
    matchet: matchet ?? 0,
  });
}
