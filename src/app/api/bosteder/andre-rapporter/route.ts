// src/app/api/bosteder/andre-rapporter/route.ts
// Returnerer øvrige STPS-rapporter for samme CVR-nummer, ekskl. den aktuelle rapport.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type AndenRapport = {
  id: string;
  navn: string | null;
  rapportDato: string | null;
  rapportUrl: string;
  pdfUrl: string | null;
  fundNiveau: string | null;
  tilsynsform: string | null;
};

export async function GET(request: NextRequest) {
  const cvr = request.nextUrl.searchParams.get('cvr')?.trim();
  const ekskluderId = request.nextUrl.searchParams.get('ekskluder')?.trim();

  if (!cvr) return NextResponse.json([]);

  const supabase = getSupabaseServerClient();

  let query = supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_dato, rapport_url, pdf_url, fund_niveau, tilsynsform')
    .eq('cvr', cvr)
    .order('rapport_dato', { ascending: false });

  if (ekskluderId) query = query.neq('id', ekskluderId);

  const { data, error } = await query;
  if (error) return NextResponse.json([]);

  const rapporter: AndenRapport[] = (data ?? []).map((r) => ({
    id: r.id,
    navn: r.stps_tilbud_navn,
    rapportDato: r.rapport_dato,
    rapportUrl: r.rapport_url,
    pdfUrl: r.pdf_url,
    fundNiveau: r.fund_niveau,
    tilsynsform: r.tilsynsform,
  }));

  return NextResponse.json(rapporter);
}
