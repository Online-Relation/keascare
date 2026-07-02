// src/app/api/scrapers/cvr/status/route.ts
// Returnerer antal records der mangler CVR-enrichment

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const [{ count: manglerCvr }, { count: manglerData }] = await Promise.all([
    supabase
      .from('stps_rapporter')
      .select('id', { count: 'exact', head: true })
      .is('cvr', null)
      .or('p_nummer.not.is.null,tp_p_nummer.not.is.null'),
    supabase
      .from('stps_rapporter')
      .select('id', { count: 'exact', head: true })
      .not('cvr', 'is', null)
      .or('cvr_ansatte.is.null,cvr_branche.is.null'),
  ]);

  return NextResponse.json({
    manglerCvr: manglerCvr ?? 0,
    manglerData: manglerData ?? 0,
    total: (manglerCvr ?? 0) + (manglerData ?? 0),
  });
}
