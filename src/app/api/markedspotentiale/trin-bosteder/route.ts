// src/app/api/markedspotentiale/trin-bosteder/route.ts
// Returnerer bosteder for et givet salgstragt-trin

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type TrinBosted = {
  id: string;
  stps_tilbud_navn: string | null;
  kommune: string | null;
  fund_niveau: string | null;
  rapport_dato: string | null;
  monday_item_id: string | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trin = searchParams.get('trin');
  const fra = searchParams.get('fra');
  const til = searchParams.get('til');

  const supabase = getSupabaseServerClient();

  let query = supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, kommune, fund_niveau, rapport_dato, monday_item_id')
    .order('rapport_dato', { ascending: false })
    .limit(200);

  if (fra) query = query.gte('rapport_dato', fra);
  if (til) query = query.lte('rapport_dato', til);

  // Filtrer per trin
  if (trin === 'med-fund') {
    query = query.not('fund_niveau', 'is', null).not('fund_niveau', 'in', '("ingen","ukendt")');
  } else if (trin === 'kritisk-stoerre') {
    query = query.in('fund_niveau', ['kritisk', 'stoerre']);
  } else if (trin === 'ikke-bearbejdet') {
    query = query.in('fund_niveau', ['kritisk', 'stoerre']).is('monday_item_id', null);
  } else if (trin === 'kunder') {
    query = query.not('monday_item_id', 'is', null);
  } else {
    return NextResponse.json({ error: 'Ukendt trin' }, { status: 400 });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
