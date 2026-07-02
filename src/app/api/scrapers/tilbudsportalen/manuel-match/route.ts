// src/app/api/scrapers/tilbudsportalen/manuel-match/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function POST(request: NextRequest) {
  const body = await request.json() as { stpsId: number; tpId: number };
  if (!body.stpsId || !body.tpId) {
    return NextResponse.json({ error: 'Mangler stpsId eller tpId' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: tp, error: tpFejl } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('tilbudstype, pladser, p_nummer, kommune, kontaktperson, telefon, email, tilbuddets_adresse, leder, website, virksomheds_navn, tilsynsmyndighed, pladser_pr_paragraf, driftsform')
    .eq('id', body.tpId)
    .single();

  if (tpFejl || !tp) return NextResponse.json({ error: 'Tilbud ikke fundet' }, { status: 404 });

  const { error } = await supabase
    .from('stps_rapporter')
    .update({
      tp_tilbudstype: tp.tilbudstype,
      tp_pladser: tp.pladser?.toString() ?? null,
      tp_p_nummer: tp.p_nummer,
      tp_kommune: tp.kommune,
      tp_kontaktperson: tp.kontaktperson,
      tp_telefon: tp.telefon,
      tp_email: tp.email,
      tp_adresse: tp.tilbuddets_adresse,
      tp_leder: tp.leder,
      tp_website: tp.website,
      tp_virksomheds_navn: tp.virksomheds_navn,
      tp_tilsynsmyndighed: tp.tilsynsmyndighed,
      tp_pladser_pr_paragraf: tp.pladser_pr_paragraf,
      tp_driftsform: tp.driftsform,
    })
    .eq('id', body.stpsId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
