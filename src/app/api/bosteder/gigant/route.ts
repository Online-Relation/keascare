// src/app/api/bosteder/gigant/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { id?: string; erGigant?: boolean };
  if (!body.id) return NextResponse.json({ error: 'Mangler id' }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('stps_rapporter')
    .update({ er_gigant: body.erGigant ?? false })
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, erGigant: body.erGigant ?? false });
}
