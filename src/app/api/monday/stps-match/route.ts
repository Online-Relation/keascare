// src/app/api/monday/stps-match/route.ts
// Returnerer map fra monday_item_id → stps rapport id for kunder der findes i systemet

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, monday_item_id')
    .not('monday_item_id', 'is', null);

  if (error) return NextResponse.json({}, { status: 500 });

  const map: Record<string, string> = {};
  for (const r of data ?? []) {
    map[r.monday_item_id] = r.id;
  }

  return NextResponse.json(map);
}
