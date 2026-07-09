// Linker en Monday-kunde til et bosted via CVR.
// Opretter bostedet i stps_rapporter hvis det ikke findes, og sætter monday_item_id.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

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
    // Opret en minimal rapport-række så bostedet eksisterer i systemet
    const { data: ny, error } = await supabase
      .from('stps_rapporter')
      .insert({
        stps_tilbud_navn: kunde?.navn ?? `CVR ${cvr}`,
        rapport_titel:    kunde?.navn ?? `CVR ${cvr}`,
        rapport_url:      '',
        rapport_dato:     new Date().toISOString().slice(0, 10),
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

  // Berig bostedet med CVR- og regnskabsdata i baggrunden
  const baseUrl = req.nextUrl.origin;
  fetch(`${baseUrl}/api/scrapers/berig-bosted`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bostedId, cvr }),
  }).catch(console.error);

  return NextResponse.json({ ok: true, bostedId });
}
