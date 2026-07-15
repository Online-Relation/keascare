// src/app/api/system/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { KOMMUNALE_DRIFTSFORMER, KOMMUNALE_CVR_TYPER } from '@/lib/config/GlobalFilter';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const visFilter = request.nextUrl.searchParams.get('visFilter') ?? 'alle';
  const privat = visFilter === 'privat';

  const tpOrFilter = `tp_driftsform.is.null,tp_driftsform.not.in.(${KOMMUNALE_DRIFTSFORMER.join(',')})`;
  const cvrOrFilter = `cvr_virksomhedstype.is.null,cvr_virksomhedstype.not.in.(${KOMMUNALE_CVR_TYPER.join(',')})`;

  const igår = new Date();
  igår.setDate(igår.getDate() - 1);
  const igårIso = igår.toISOString();
  const ugeAgo = new Date();
  ugeAgo.setDate(ugeAgo.getDate() - 7);
  const ugeIso = ugeAgo.toISOString();

  let qTotal = supabase.from('stps_rapporter').select('*', { count: 'exact', head: true });
  let qIgår  = supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).gte('scraper_dato', igårIso);
  let qUge   = supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).gte('scraper_dato', ugeIso);

  if (privat) {
    qTotal = qTotal.or(tpOrFilter).or(cvrOrFilter);
    qIgår  = qIgår.or(tpOrFilter).or(cvrOrFilter);
    qUge   = qUge.or(tpOrFilter).or(cvrOrFilter);
  }

  const [
    { count: stpsTotal },
    { count: stpsIgår },
    { count: stpsUge },
    { count: tpTotal },
    { count: tpManglerDetaljer },
    { count: cvrHar },
    { count: cvrMangler },
    { count: cvrAnsatte },
    { count: mondayMatchet },
    { count: tpMatchet },
  ] = await Promise.all([
    qTotal,
    qIgår,
    qUge,
    supabase.from('tilbudsportalen_tilbud').select('*', { count: 'exact', head: true }),
    supabase.from('tilbudsportalen_tilbud').select('*', { count: 'exact', head: true }).eq('detaljer_hentet', false),
    supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).not('cvr', 'is', null),
    supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).is('cvr', null),
    supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).not('cvr_ansatte', 'is', null),
    supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).not('monday_item_id', 'is', null),
    supabase.from('stps_rapporter').select('*', { count: 'exact', head: true }).not('tp_tilbudstype', 'is', null),
  ]);

  return NextResponse.json({
    stps: {
      total: stpsTotal ?? 0,
      nyeIgår: stpsIgår ?? 0,
      nyeUge: stpsUge ?? 0,
    },
    tp: {
      total: tpTotal ?? 0,
      manglerDetaljer: tpManglerDetaljer ?? 0,
      matchetModStps: tpMatchet ?? 0,
    },
    cvr: {
      har: cvrHar ?? 0,
      mangler: cvrMangler ?? 0,
      harAnsatte: cvrAnsatte ?? 0,
    },
    monday: {
      matchet: mondayMatchet ?? 0,
    },
  });
}
