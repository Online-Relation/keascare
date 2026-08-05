// src/app/api/admin/fix-fund-niveau/route.ts
// Sæt fund_niveau = 'ingen' på alle rækker hvor det er null — kun for development.
// GET: vis antal berørte rækker
// POST: udfør rettelsen

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

function tjekAdgang(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret') ?? req.nextUrl.searchParams.get('secret') ?? '';
  if (!secret || secret !== process.env.SCRAPER_SECRET) return null;
  return getSupabaseServerClient();
}

export async function GET(req: NextRequest) {
  const supabase = tjekAdgang(req);
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
  const supabase = tjekAdgang(req);
  if (!supabase) return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });

  const { error, count } = await supabase
    .from('stps_rapporter')
    .update({ fund_niveau: 'ingen' })
    .is('fund_niveau', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, rettet: count ?? 'ukendt antal' });
}
