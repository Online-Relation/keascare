// src/app/api/scrapers/tilbudsportalen/reset-detaljer/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

// Nulstiller detaljer_hentet så alle rækker re-scrapes og får driftsform udfyldt
export async function POST() {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from('tilbudsportalen_tilbud')
    .update({ detaljer_hentet: false, driftsform: null })
    .not('id', 'is', null);

  if (error) {
    return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
