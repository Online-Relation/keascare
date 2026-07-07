// src/app/api/scrapers/tilbudsportalen/reset-detaljer/route.ts
// Nulstiller detaljer_hentet så rækker re-scrapes.
// Default: kun rækker der er hentet men mangler CVR (Cloudflare-blokkerede svar).
// ?alle=true nulstiller samtlige rækker.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function POST(request: NextRequest) {
  const alle = request.nextUrl.searchParams.get('alle') === 'true';
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from('tilbudsportalen_tilbud')
    .update({ detaljer_hentet: false })
    .eq('detaljer_hentet', true);

  if (!alle) {
    // Kun rækker der er markeret som hentet men mangler CVR
    // — indikerer at Cloudflare blokkerede og returnerede en challenge-side
    query = query.is('cvr', null);
  }

  const { error } = await query;

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, alle });
}
