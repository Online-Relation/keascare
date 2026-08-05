// src/app/api/search/bosteder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type BostedSøgeresultat = {
  id: string;
  navn: string;
  kommune: string | null;
  region: string | null;
  fundNiveau: string | null;
  kilde: 'stps' | 'tp';
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = getSupabaseServerClient();
  const erCvr = /^\d{6,8}$/.test(q);

  // Søg i STPS-rapporter
  const stpsQuery = supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, kommune, region, fund_niveau, cvr')
    .order('rapport_dato', { ascending: false })
    .limit(15);

  const { data: stpsData } = erCvr
    ? await stpsQuery.ilike('cvr', `%${q}%`)
    : await stpsQuery.ilike('stps_tilbud_navn', `%${q}%`);

  // Søg i Tilbudsportalen — fanger bosteder der ikke har STPS-rapport
  const tpQuery = supabase
    .from('tilbudsportalen_tilbud')
    .select('id, navn, kommune, cvr')
    .limit(10);

  const { data: tpData } = erCvr
    ? await tpQuery.ilike('cvr', `%${q}%`)
    : await tpQuery.ilike('navn', `%${q}%`);

  // Byg resultat og deduplisér på CVR → foretrækker STPS (har fund-niveau)
  const seetCvr = new Set<string>();
  const seetNavn = new Set<string>();
  const unikke: BostedSøgeresultat[] = [];

  // STPS først — har flest data
  for (const row of stpsData ?? []) {
    const cvr = row.cvr?.trim();
    const navn = (row.stps_tilbud_navn ?? '').trim();
    if (!navn) continue;
    if (cvr && seetCvr.has(cvr)) continue;
    if (seetNavn.has(navn.toLowerCase())) continue;
    if (cvr) seetCvr.add(cvr);
    seetNavn.add(navn.toLowerCase());
    unikke.push({
      id: row.id,
      navn,
      kommune: row.kommune ?? null,
      region: row.region ?? null,
      fundNiveau: row.fund_niveau ?? null,
      kilde: 'stps',
    });
    if (unikke.length >= 8) break;
  }

  // TP som supplement — hvis der er plads og bostedet ikke allerede er fundet
  for (const row of tpData ?? []) {
    if (unikke.length >= 8) break;
    const cvr = row.cvr?.trim();
    const navn = (row.navn ?? '').trim();
    if (!navn) continue;
    if (cvr && seetCvr.has(cvr)) continue;
    if (seetNavn.has(navn.toLowerCase())) continue;
    if (cvr) seetCvr.add(cvr);
    seetNavn.add(navn.toLowerCase());
    unikke.push({
      id: row.id,
      navn,
      kommune: row.kommune ?? null,
      region: null,
      fundNiveau: null,
      kilde: 'tp',
    });
  }

  return NextResponse.json(unikke);
}
