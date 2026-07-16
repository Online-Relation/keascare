// Midlertidigt debug-endpoint — slet efter brug
// GET /api/debug/dato?dato=2026-07-07

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET(req: NextRequest) {
  const dato = req.nextUrl.searchParams.get('dato') ?? '2026-07-07';
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_dato, fund_niveau, monday_item_id, monday_gruppe, tp_driftsform, cvr_virksomhedstype')
    .gte('rapport_dato', dato)
    .lte('rapport_dato', dato)
    .order('rapport_dato', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    dato,
    antal: data?.length ?? 0,
    rapporter: data?.map((r) => ({
      navn: r.stps_tilbud_navn,
      fund: r.fund_niveau,
      monday: r.monday_item_id ? `kunde (${r.monday_gruppe})` : 'ingen',
      tp_driftsform: r.tp_driftsform,
      cvr_type: r.cvr_virksomhedstype,
    })),
  });
}
