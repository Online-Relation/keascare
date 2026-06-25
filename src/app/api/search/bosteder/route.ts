// src/app/api/search/bosteder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type BostedSøgeresultat = {
  id: string;
  navn: string;
  kommune: string | null;
  region: string | null;
  fundNiveau: string | null;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, kommune, region, fund_niveau')
    .ilike('stps_tilbud_navn', `%${q}%`)
    .or('tp_tilbudstype.is.null,tp_tilbudstype.ilike.%107%,tp_tilbudstype.ilike.%108%')
    .order('rapport_dato', { ascending: false })
    .limit(8);

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  const unikke = new Map<string, BostedSøgeresultat>();
  for (const row of data ?? []) {
    if (!unikke.has(row.stps_tilbud_navn)) {
      unikke.set(row.stps_tilbud_navn, {
        id: row.id,
        navn: row.stps_tilbud_navn,
        kommune: row.kommune ?? null,
        region: row.region ?? null,
        fundNiveau: row.fund_niveau ?? null,
      });
    }
  }

  return NextResponse.json(Array.from(unikke.values()));
}
