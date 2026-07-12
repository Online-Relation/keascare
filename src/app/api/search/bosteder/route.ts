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
    .select('id, stps_tilbud_navn, kommune, region, fund_niveau, cvr')
    .ilike('stps_tilbud_navn', `%${q}%`)
    .order('rapport_dato', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  // Deduplisér på CVR (samme bosted, forskellig rapport) — derefter på navn
  const seetCvr = new Set<string>();
  const seetNavn = new Set<string>();
  const unikke: BostedSøgeresultat[] = [];

  for (const row of data ?? []) {
    const cvr = row.cvr?.trim();
    const navn = row.stps_tilbud_navn ?? '';

    if (cvr && seetCvr.has(cvr)) continue;
    if (seetNavn.has(navn)) continue;

    if (cvr) seetCvr.add(cvr);
    seetNavn.add(navn);

    unikke.push({
      id: row.id,
      navn,
      kommune: row.kommune ?? null,
      region: row.region ?? null,
      fundNiveau: row.fund_niveau ?? null,
    });

    if (unikke.length >= 8) break;
  }

  return NextResponse.json(unikke);
}
