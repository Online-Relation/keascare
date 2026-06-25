// src/app/api/debug/reset-pdf/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

// Nulstiller pdf_behandlet = false for rapporter der har pdf_url men mangler vurdering og fund
export async function POST() {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .update({ pdf_behandlet: false })
    .eq('pdf_behandlet', true)
    .not('pdf_url', 'is', null)
    .is('pdf_vurdering', null)
    .is('pdf_fund', null)
    .select('id');

  if (error) {
    return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, nulstillet: data?.length ?? 0 });
}
