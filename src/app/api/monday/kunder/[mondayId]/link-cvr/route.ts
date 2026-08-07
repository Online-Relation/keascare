// Linker en Monday-kunde til et bosted via CVR.
// Opretter bostedet i stps_rapporter hvis det ikke findes, og sætter monday_item_id.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { slaaCvrOp } from '@/lib/api/CvrClient';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ mondayId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { mondayId } = await params;

  let cvr: string;
  try {
    const body = await req.json();
    cvr = String(body.cvr ?? '').trim().replace(/\s/g, '');
  } catch {
    return NextResponse.json({ ok: false, fejl: 'Ugyldig JSON' }, { status: 400 });
  }

  if (!cvr || !/^\d{8}$/.test(cvr)) {
    return NextResponse.json({ ok: false, fejl: 'CVR skal være 8 cifre' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // Hent Monday-kundens navn fra cachen
  const { data: kunde } = await supabase
    .from('monday_kunder')
    .select('navn, gruppe_navn')
    .eq('monday_id', mondayId)
    .single();

  const mondayData = {
    monday_item_id:    mondayId,
    monday_gruppe:     kunde?.gruppe_navn ?? null,
    monday_match_dato: new Date().toISOString(),
  };

  // Tjek om der allerede er en stps_rapport med dette CVR
  const { data: eksisterende } = await supabase
    .from('stps_rapporter')
    .select('id')
    .eq('cvr', cvr)
    .order('rapport_dato', { ascending: false })
    .limit(1)
    .maybeSingle();

  let bostedId: string;

  if (eksisterende) {
    // Opdater eksisterende rapport med Monday-link
    await supabase
      .from('stps_rapporter')
      .update(mondayData)
      .eq('cvr', cvr);
    bostedId = eksisterende.id;
  } else {
    // Opret en minimal rapport-række så bostedet eksisterer i systemet.
    // rapport_url bruger 'stps://genereret/'-markøren — samme som resten af
    // systemet genkender som 'ingen ægte STPS-tilsynsrapport', så bostedet
    // ikke fejlagtigt vises som om det har haft tilsyn. rapport_dato sættes
    // IKKE til dagens dato — det ville se ud som en fiktiv rapportdato.
    const navn = kunde?.navn ?? `CVR ${cvr}`;
    const { data: ny, error } = await supabase
      .from('stps_rapporter')
      .insert({
        stps_tilbud_navn: navn,
        rapport_titel:    navn,
        rapport_url:      `stps://genereret/${encodeURIComponent(navn)}`,
        rapport_dato:     null,
        fund_niveau:      'ukendt',
        cvr,
        ...mondayData,
      })
      .select('id')
      .single();

    if (error || !ny) {
      return NextResponse.json({ ok: false, fejl: error?.message ?? 'Oprettelse fejlede' }, { status: 500 });
    }
    bostedId = ny.id;
  }

  // Berig med det samme i stedet for at vente på næste nats Nova-kørsel —
  // CVR-ansatte/branche/type, og et opslag mod Tilbudsportalen for
  // kommune/tilbudstype hvis vi finder en TP-modpart på samme CVR.
  try {
    const [cvrOpslag, { data: tpMatch }] = await Promise.all([
      slaaCvrOp(cvr).catch(() => null),
      supabase
        .from('tilbudsportalen_tilbud')
        .select('tilbudstype, driftsform, kommune')
        .eq('cvr', cvr)
        .limit(1)
        .maybeSingle(),
    ]);

    await supabase.from('stps_rapporter').update({
      ...(cvrOpslag ? {
        cvr_ansatte:         cvrOpslag.ansatte,
        cvr_branche:         cvrOpslag.branche,
        cvr_virksomhedstype: cvrOpslag.virksomhedstype,
        cvr_stiftet:         cvrOpslag.stiftet,
        cvr_opdateret:       new Date().toISOString(),
      } : {}),
      ...(tpMatch ? {
        tp_tilbudstype: tpMatch.tilbudstype,
        tp_driftsform:  tpMatch.driftsform,
        kommune:        tpMatch.kommune,
      } : {}),
      tp_match_forsoegt: new Date().toISOString(),
    }).eq('id', bostedId);
  } catch {
    // Berigelse fejlede — bostedet er stadig korrekt oprettet/linket,
    // og bliver fanget af næste nats Nova-kørsel i stedet.
  }

  return NextResponse.json({ ok: true, bostedId });
}
