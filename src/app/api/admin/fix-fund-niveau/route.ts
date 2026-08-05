// src/app/api/admin/fix-fund-niveau/route.ts
// Sæt fund_niveau = 'ingen' på alle rækker hvor det er null — kun for development.
// GET: vis antal berørte rækker
// POST: udfør rettelsen

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { BrugerRolle } from '@/features/auth/config/roller.config';

async function tjekAdgang(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const rolle = user?.user_metadata?.rolle as BrugerRolle | undefined;
  if (!user || rolle !== 'development') return null;
  return supabase;
}

export async function GET(req: NextRequest) {
  const supabase = await tjekAdgang(req);
  if (!supabase) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });

  const { count } = await supabase
    .from('stps_rapporter')
    .select('*', { count: 'exact', head: true })
    .is('fund_niveau', null);

  const { data: eksempler } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_url, rapport_dato, kommune, tilsynsform')
    .is('fund_niveau', null)
    .order('rapport_dato', { ascending: false, nullsFirst: false })
    .limit(10);

  return NextResponse.json({ antalMedNull: count, eksempler });
}

export async function POST(req: NextRequest) {
  const supabase = await tjekAdgang(req);
  if (!supabase) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });

  const { error, count } = await supabase
    .from('stps_rapporter')
    .update({ fund_niveau: 'ingen' })
    .is('fund_niveau', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, rettet: count ?? 'ukendt antal' });
}
