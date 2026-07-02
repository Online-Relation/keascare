import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { slaaCvrOp } from '@/lib/api/CvrClient';

export async function GET(request: NextRequest) {
  const cvr = request.nextUrl.searchParams.get('cvr')?.trim().replace(/\s/g, '');
  if (!cvr || !/^\d{8}$/.test(cvr)) {
    return NextResponse.json({ fejl: 'CVR skal være 8 cifre' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  let cvrData = null;
  let cvrFejl: string | null = null;
  try {
    cvrData = await slaaCvrOp(cvr);
  } catch (e) {
    cvrFejl = e instanceof Error ? e.message : String(e);
  }

  const [stpsRader, navnRader] = await Promise.all([
    supabase
      .from('stps_rapporter')
      .select('id, stps_tilbud_navn, tp_adresse, adresse, kommune, tp_kommune, fund_niveau, rapport_dato, monday_item_id, p_nummer, cvr')
      .eq('cvr', cvr)
      .order('rapport_dato', { ascending: false }),

    cvrData?.navn
      ? supabase
          .from('stps_rapporter')
          .select('id, stps_tilbud_navn, tp_adresse, adresse, kommune, tp_kommune, fund_niveau, rapport_dato, monday_item_id, p_nummer, cvr')
          .is('cvr', null)
          .ilike('stps_tilbud_navn', `%${cvrData.navn.split(' ')[0]}%`)
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const navnMatches = (navnRader.data ?? []).filter(
    (r) => !stpsRader.data?.find((s) => s.id === r.id)
  );

  return NextResponse.json({
    cvr,
    cvrData,
    cvrFejl,
    stpsBosteder: stpsRader.data ?? [],
    navnMatches,
  });
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await request.json() as {
    bostedId: string;
    cvr: string;
    navn?: string;
    adresse?: string;
    ansatte?: number | null;
    branche?: string | null;
    virksomhedstype?: string | null;
    stiftet?: string | null;
  };

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('stps_rapporter')
    .update({
      cvr: body.cvr,
      ...(body.adresse ? { adresse: body.adresse } : {}),
      ...(body.ansatte != null ? { cvr_ansatte: body.ansatte } : {}),
      ...(body.branche ? { cvr_branche: body.branche } : {}),
      ...(body.virksomhedstype ? { cvr_virksomhedstype: body.virksomhedstype } : {}),
      ...(body.stiftet ? { cvr_stiftet: body.stiftet } : {}),
      cvr_opdateret: new Date().toISOString(),
    })
    .eq('id', body.bostedId);

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
