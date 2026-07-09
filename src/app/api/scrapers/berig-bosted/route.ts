// Beriger ét specifikt bosted med CVR-data og regnskab med det samme.
// Bruges efter manuel CVR-link via KundeDetailPage.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { slaaCvrOp } from '@/lib/api/CvrClient';
import { hentRegnskab } from '@/lib/api/RegnskabClient';
import { søgStpsForCvr } from '@/features/stps/services/StpsCvrSøgService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let bostedId: string;
  let cvr: string;
  try {
    const body = await req.json();
    bostedId = String(body.bostedId ?? '');
    cvr = String(body.cvr ?? '').trim().replace(/\s/g, '');
  } catch {
    return NextResponse.json({ ok: false, fejl: 'Ugyldig JSON' }, { status: 400 });
  }

  if (!bostedId || !cvr) {
    return NextResponse.json({ ok: false, fejl: 'bostedId og cvr kræves' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const resultater: Record<string, string> = {};

  // CVR-data
  try {
    const cvrData = await slaaCvrOp(cvr);
    if (cvrData) {
      await supabase.from('stps_rapporter').update({
        cvr_ansatte:         cvrData.ansatte,
        cvr_branche:         cvrData.branche,
        cvr_virksomhedstype: cvrData.virksomhedstype,
        cvr_stiftet:         cvrData.stiftet,
        cvr_opdateret:       new Date().toISOString(),
        ...(cvrData.adresse ? { adresse: cvrData.adresse } : {}),
        ...(cvrData.navn ? { stps_tilbud_navn: cvrData.navn, rapport_titel: cvrData.navn } : {}),
      }).eq('id', bostedId);
      resultater.cvr = 'ok';
    } else {
      resultater.cvr = 'ingen data';
    }
  } catch (e) {
    resultater.cvr = e instanceof Error ? e.message : 'fejl';
  }

  // Regnskab
  try {
    const regnskab = await hentRegnskab(cvr);
    if (regnskab) {
      await supabase.from('stps_rapporter').update({
        regnskab_aar:             regnskab.regnskabsaar,
        regnskab_periode_start:   regnskab.periodeStart,
        regnskab_periode_slut:    regnskab.periodeSlut,
        regnskab_nettoomsaetning: regnskab.nettoomsaetning,
        regnskab_bruttofortjeneste: regnskab.bruttofortjeneste,
        regnskab_aarsresultat:    regnskab.aarsresultat,
        regnskab_egenkapital:     regnskab.egenkapital,
        regnskab_balance:         regnskab.balance,
        regnskab_opdateret:       new Date().toISOString(),
      }).eq('id', bostedId);
      resultater.regnskab = 'ok';
    } else {
      await supabase.from('stps_rapporter')
        .update({ regnskab_opdateret: new Date().toISOString() })
        .eq('id', bostedId);
      resultater.regnskab = 'ingen data';
    }
  } catch (e) {
    resultater.regnskab = e instanceof Error ? e.message : 'fejl';
  }

  // STPS-søgning på CVR — kør i baggrunden da det tager længere tid
  søgStpsForCvr(cvr, bostedId).then((r) => {
    resultater.stps = `fundet: ${r.fundet}, gemt: ${r.gemt}`;
  }).catch((e) => {
    resultater.stps = e instanceof Error ? e.message : 'fejl';
  });

  return NextResponse.json({ ok: true, resultater });
}
