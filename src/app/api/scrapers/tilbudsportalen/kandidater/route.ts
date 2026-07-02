// src/app/api/scrapers/tilbudsportalen/kandidater/route.ts
// Returnerer umatchede STPS-rapporter med de bedste TP-kandidater pr. rapport

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { fuzzyScore, normaliserNavn } from '@/features/tilbudsportalen/matcher/TilbudsportalenMatcher';

type TpTilbud = {
  id: number;
  cvr: string | null;
  navn: string | null;
  tilbudstype: string | null;
  kommune: string | null;
  telefon: string | null;
  email: string | null;
  tilbuddets_adresse: string | null;
  pladser: number | null;
};

export type ManuelMatchKandidat = {
  stpsId: number;
  stpsNavn: string;
  stpsKommune: string | null;
  stpsFund: string | null;
  kandidater: {
    tpId: number;
    tpNavn: string;
    tpKommune: string | null;
    tpAdresse: string | null;
    tpTelefon: string | null;
    tpEmail: string | null;
    tpPladser: number | null;
    score: number;
  }[];
};

export async function GET() {
  const supabase = getSupabaseServerClient();

  const [{ data: umatched }, { data: tilbud }] = await Promise.all([
    supabase
      .from('stps_rapporter')
      .select('id, stps_tilbud_navn, kommune, tp_kommune, fund_niveau')
      .is('tp_tilbudstype', null)
      .not('stps_tilbud_navn', 'is', null)
      .order('rapport_dato', { ascending: false })
      .limit(100),
    supabase
      .from('tilbudsportalen_tilbud')
      .select('id, cvr, navn, tilbudstype, kommune, telefon, email, tilbuddets_adresse, pladser'),
  ]);

  if (!umatched || !tilbud) return NextResponse.json([]);

  const alleTilbud = tilbud as TpTilbud[];

  const resultater: ManuelMatchKandidat[] = [];

  for (const r of umatched as { id: number; stps_tilbud_navn: string; kommune: string | null; tp_kommune: string | null; fund_niveau: string | null }[]) {
    const scorede = alleTilbud
      .filter((t) => t.navn)
      .map((t) => ({
        tpId: t.id,
        tpNavn: t.navn!,
        tpKommune: t.kommune,
        tpAdresse: t.tilbuddets_adresse,
        tpTelefon: t.telefon,
        tpEmail: t.email,
        tpPladser: t.pladser,
        score: fuzzyScore(r.stps_tilbud_navn, t.navn!),
      }))
      .filter((k) => k.score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (scorede.length === 0) continue;

    resultater.push({
      stpsId: r.id,
      stpsNavn: r.stps_tilbud_navn,
      stpsKommune: r.kommune ?? r.tp_kommune,
      stpsFund: r.fund_niveau,
      kandidater: scorede,
    });
  }

  // Sorter: bosteder med kandidater med høj score øverst
  resultater.sort((a, b) => b.kandidater[0].score - a.kandidater[0].score);

  return NextResponse.json(resultater);
}
