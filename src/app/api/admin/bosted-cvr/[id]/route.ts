// src/app/api/admin/bosted-cvr/[id]/route.ts
// Kun for development-rollen: sæt CVR-nummer på et bosted og kør CVR-sync.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { slaaCvrOp } from '@/lib/api/CvrClient';
import type { BrugerRolle } from '@/features/auth/config/roller.config';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const rolle = user?.user_metadata?.rolle as BrugerRolle | undefined;

  if (!user || rolle !== 'development') {
    return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  }

  const body = await req.json();
  const cvr = String(body.cvr ?? '').trim();
  if (!/^\d{8}$/.test(cvr)) {
    return NextResponse.json({ error: 'CVR skal være 8 cifre' }, { status: 400 });
  }

  // Gem CVR og nulstil cvr_opdateret så sync køres
  const { error: updateErr } = await supabase
    .from('stps_rapporter')
    .update({ cvr, cvr_opdateret: null })
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Slå straks CVR-data op og gem det
  try {
    const opslag = await slaaCvrOp(cvr);
    if (opslag) {
      await supabase
        .from('stps_rapporter')
        .update({
          cvr_ansatte: opslag.ansatte,
          cvr_branche: opslag.branche,
          cvr_virksomhedstype: opslag.virksomhedstype,
          cvr_stiftet: opslag.stiftet,
          cvr_opdateret: new Date().toISOString(),
        })
        .eq('id', id);
    }
    return NextResponse.json({ ok: true, opslag });
  } catch {
    return NextResponse.json({ ok: true, advarsel: 'CVR gemt, men live-opslag fejlede' });
  }
}
