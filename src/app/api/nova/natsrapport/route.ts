// src/app/api/nova/natsrapport/route.ts
// Returnerer Novas seneste natsrapport til talebobbelen i banneret.

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type NovaNatsrapport = {
  kørtDato: string;
  cvrBeriget: number;
  tpBeriget: number;
  tpRequeued: number;
  losMatchet: number;
  mondayMatchet: number;
  totalFejl: number;
};

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from('nova_natsrapport')
      .select('udfort_dato, cvr_beriget, tp_beriget, tp_requeued, los_matchet, monday_matchet, total_fejl')
      .order('udfort_dato', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return NextResponse.json({ rapport: null });

    const rapport: NovaNatsrapport = {
      kørtDato:      (data as unknown as { udfort_dato: string }).udfort_dato,
      cvrBeriget:    data.cvr_beriget    ?? 0,
      tpBeriget:     data.tp_beriget     ?? 0,
      tpRequeued:    data.tp_requeued    ?? 0,
      losMatchet:    data.los_matchet    ?? 0,
      mondayMatchet: data.monday_matchet ?? 0,
      totalFejl:     data.total_fejl     ?? 0,
    };

    return NextResponse.json({ rapport });
  } catch {
    return NextResponse.json({ rapport: null });
  }
}
