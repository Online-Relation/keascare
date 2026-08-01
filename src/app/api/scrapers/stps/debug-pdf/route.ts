// src/app/api/scrapers/stps/debug-pdf/route.ts
// Bruges til at fejlsøge PDF-parsing af deltagere
// GET /api/scrapers/stps/debug-pdf?url=<pdf-url>

import { NextRequest, NextResponse } from 'next/server';
import { parsePdfFraUrl } from '@/features/stps/scraper/StpsPdfParser';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET(req: NextRequest) {
  const pdfUrl = req.nextUrl.searchParams.get('url');

  // Hvis ingen URL givet: hent en rapport fra databasen med pdf_url
  if (!pdfUrl) {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from('stps_rapporter')
      .select('id, stps_tilbud_navn, pdf_url, tilsyn_deltagere_stps')
      .not('pdf_url', 'is', null)
      .limit(5);

    return NextResponse.json({
      besked: 'Giv ?url=<pdf-url> for at parse en specifik PDF. Her er 5 rapporter med pdf_url:',
      eksempler: (data ?? []).map((r) => ({
        navn: r.stps_tilbud_navn,
        pdfUrl: r.pdf_url,
        harDeltagere: r.tilsyn_deltagere_stps !== null,
      })),
    });
  }

  try {
    const detaljer = await parsePdfFraUrl(pdfUrl);
    return NextResponse.json({
      pdfUrl,
      deltagereStps: detaljer.deltagereStps,
      deltagereBosted: detaljer.deltagereBosted,
      antalStps: detaljer.deltagereStps.length,
      antalBosted: detaljer.deltagereBosted.length,
      cvr: detaljer.cvr,
      adresse: detaljer.adresse,
      harVurdering: !!detaljer.vurdering,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
