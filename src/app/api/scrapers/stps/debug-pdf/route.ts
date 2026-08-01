// src/app/api/scrapers/stps/debug-pdf/route.ts
// Bruges til at fejlsøge PDF-parsing af deltagere
// GET /api/scrapers/stps/debug-pdf?url=<pdf-url>

import { NextRequest, NextResponse } from 'next/server';
import { parsePdfFraUrl } from '@/features/stps/scraper/StpsPdfParser';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET(req: NextRequest) {
  const pdfUrl = req.nextUrl.searchParams.get('url');

  // Hvis ingen URL givet: hent en rapport fra databasen med pdf_storage_url
  if (!pdfUrl) {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from('stps_rapporter')
      .select('id, stps_tilbud_navn, pdf_url, pdf_storage_url, tilsyn_deltagere_stps')
      .not('pdf_storage_url', 'is', null)
      .limit(5);

    return NextResponse.json({
      besked: 'Giv ?url=<pdf_storage_url> for at parse en specifik PDF (brug pdf_storage_url, ikke pdf_url — gopublic.dk blokerer Railway)',
      eksempler: (data ?? []).map((r) => ({
        navn: r.stps_tilbud_navn,
        pdfStorageUrl: r.pdf_storage_url,
        harDeltagere: r.tilsyn_deltagere_stps !== null,
      })),
    });
  }

  // &rå=1 viser rå PDF-tekst rundt om deltager-sektionen (til fejlsøgning)
  const visRå = req.nextUrl.searchParams.get('rå') === '1';

  try {
    if (visRå) {
      const res = await fetch(pdfUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 });
      const buf = Buffer.from(await res.arrayBuffer());
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(buf);
      const tekst: string = result.text ?? '';
      // Find deltager-sektionen og vis 800 tegn rundt om den
      const stpsIdx = tekst.search(/Tilsynet blev foretaget af/i);
      const bostedIdx = tekst.search(/Ved tilsynet[\s\S]{0,30}deltog/i);
      return NextResponse.json({
        pdfUrl,
        stpsSektion: stpsIdx !== -1 ? tekst.substring(Math.max(0, stpsIdx - 50), stpsIdx + 500) : 'Ikke fundet',
        bostedSektion: bostedIdx !== -1 ? tekst.substring(Math.max(0, bostedIdx - 50), bostedIdx + 500) : 'Ikke fundet',
        tekstLængde: tekst.length,
      });
    }

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
