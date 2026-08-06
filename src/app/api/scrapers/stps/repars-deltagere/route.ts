// src/app/api/scrapers/stps/repars-deltagere/route.ts
//
// POST /api/scrapers/stps/repars-deltagere
//
// Genparserer tilsyn_deltagere_stps og tilsyn_deltagere_bosted for rapporter
// der endnu ikke har fået sat tilsyn_deltagere_parset_dato (null = aldrig parset).
// Kører automatisk som trin 14 i den daglige cron — ingen manuel håndtering nødvendig.
// Endpoint er idempotent: rapporter der allerede er parset springes over.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { parsePdfFraUrl } from '@/features/stps/scraper/StpsPdfParser';

export async function POST(req: NextRequest) {
  const batch = Math.min(parseInt(req.nextUrl.searchParams.get('batch') ?? '50', 10), 200);

  const supabase = getSupabaseServerClient();

  // Hent rapporter med PDF i storage der endnu ikke er (gen)parset — ældste id først
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, pdf_storage_url')
    .not('pdf_storage_url', 'is', null)
    .is('tilsyn_deltagere_parset_dato', null)
    .order('id', { ascending: true })
    .limit(batch);

  if (error) {
    return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  }

  const rækker = data ?? [];
  if (rækker.length === 0) {
    return NextResponse.json({ ok: true, behandlet: 0, besked: 'Alle rapporter er allerede parset' });
  }

  const resultater: { id: number; navn: string; stps: number; bosted: number; fejl?: string }[] = [];

  for (const r of rækker) {
    try {
      const detaljer = await parsePdfFraUrl(r.pdf_storage_url!);

      await supabase.from('stps_rapporter').update({
        tilsyn_deltagere_stps:          detaljer.deltagereStps.length   > 0 ? detaljer.deltagereStps   : null,
        tilsyn_deltagere_bosted:        detaljer.deltagereBosted.length  > 0 ? detaljer.deltagereBosted : null,
        tilsyn_deltagere_parset_dato:   new Date().toISOString(),
      }).eq('id', r.id);

      resultater.push({
        id:     r.id,
        navn:   r.stps_tilbud_navn ?? String(r.id),
        stps:   detaljer.deltagereStps.length,
        bosted: detaljer.deltagereBosted.length,
      });
    } catch (err) {
      // Gem parset_dato selv ved fejl så vi ikke sidder fast på samme rapport
      await supabase.from('stps_rapporter')
        .update({ tilsyn_deltagere_parset_dato: new Date().toISOString() })
        .eq('id', r.id);

      resultater.push({
        id:     r.id,
        navn:   r.stps_tilbud_navn ?? String(r.id),
        stps:   0,
        bosted: 0,
        fejl:   err instanceof Error ? err.message : String(err),
      });
    }
  }

  const fejlede = resultater.filter((r) => r.fejl);
  const ok      = resultater.filter((r) => !r.fejl);

  return NextResponse.json({
    ok:        true,
    behandlet: rækker.length,
    succes:    ok.length,
    fejlede:   fejlede.length,
    resultater,
  });
}
