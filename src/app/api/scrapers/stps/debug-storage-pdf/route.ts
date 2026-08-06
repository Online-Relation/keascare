// src/app/api/scrapers/stps/debug-storage-pdf/route.ts
// GET /api/scrapers/stps/debug-storage-pdf
// Henter én rapport og viser rå tekst + deltager-sektioner til diagnosticering.

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, pdf_storage_url')
    .not('pdf_storage_url', 'is', null)
    .limit(1)
    .order('id', { ascending: false });

  const r = data?.[0];
  if (!r) return NextResponse.json({ fejl: 'Ingen rapport fundet' });

  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ url: r.pdf_storage_url! });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (parser as any).getText() as { text?: string; numpages?: number };
    const tekst: string = result.text ?? '';

    const stpsIdx   = tekst.search(/Tilsynet blev foretaget af/i);
    const bostedIdx = tekst.search(/(?:Ved tilsynet[\s\S]{0,30}deltog|Fra (?:tilbuddet|bostedet|institutionen)[\s\S]{0,10}deltog)/i);

    return NextResponse.json({
      navn:          r.stps_tilbud_navn,
      url:           r.pdf_storage_url,
      sider:         result.numpages,
      tekstLængde:   tekst.length,
      harTekst:      tekst.length > 200,
      stpsSektion:   stpsIdx   !== -1 ? tekst.substring(Math.max(0, stpsIdx - 30),   stpsIdx + 400)   : 'IKKE FUNDET',
      bostedSektion: bostedIdx !== -1 ? tekst.substring(Math.max(0, bostedIdx - 30), bostedIdx + 400) : 'IKKE FUNDET',
      tekstStart:    tekst.substring(0, 1000),
    });
  } catch (err) {
    return NextResponse.json({
      navn:      r.stps_tilbud_navn,
      url:       r.pdf_storage_url,
      parseFejl: err instanceof Error ? err.message : String(err),
    });
  }
}
