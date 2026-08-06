// src/app/api/scrapers/stps/debug-storage-pdf/route.ts
//
// GET /api/scrapers/stps/debug-storage-pdf
//
// Henter én tilfældig rapport med pdf_storage_url og viser:
// - HTTP-statuskode fra storage
// - Længde af udtrukket tekst
// - De første 2000 tegn af teksten
// - Deltager-sektionerne (rå)
// Bruges til at diagnosticere hvorfor stps=0/bosted=0.

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, pdf_storage_url')
    .not('pdf_storage_url', 'is', null)
    .limit(1)
    .order('id', { ascending: false }); // tag en nyere rapport

  const r = data?.[0];
  if (!r) return NextResponse.json({ fejl: 'Ingen rapport fundet' });

  const res = await fetch(r.pdf_storage_url!, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!res.ok) {
    return NextResponse.json({
      navn: r.stps_tilbud_navn,
      url: r.pdf_storage_url,
      httpStatus: res.status,
      fejl: `HTTP ${res.status} — PDF kunne ikke hentes`,
    });
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') ?? 'ukendt';

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js') as any;
    const pdfParse = (typeof pdfParseModule.default === 'function' ? pdfParseModule.default : pdfParseModule) as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
    const result = await pdfParse(buf);
    const tekst: string = result.text ?? '';

    const stpsIdx  = tekst.search(/Tilsynet blev foretaget af/i);
    const bostedIdx = tekst.search(/(?:Ved tilsynet[\s\S]{0,30}deltog|Fra (?:tilbuddet|bostedet|institutionen)[\s\S]{0,10}deltog)/i);

    return NextResponse.json({
      navn:        r.stps_tilbud_navn,
      url:         r.pdf_storage_url,
      httpStatus:  res.status,
      contentType,
      sider:       result.numpages,
      tekstLængde: tekst.length,
      harTekst:    tekst.length > 200,
      stpsSektion:   stpsIdx  !== -1 ? tekst.substring(Math.max(0, stpsIdx - 30),  stpsIdx + 400)  : 'IKKE FUNDET',
      bostedSektion: bostedIdx !== -1 ? tekst.substring(Math.max(0, bostedIdx - 30), bostedIdx + 400) : 'IKKE FUNDET',
      tekstStart:  tekst.substring(0, 1000),
    });
  } catch (err) {
    return NextResponse.json({
      navn: r.stps_tilbud_navn,
      url: r.pdf_storage_url,
      httpStatus: res.status,
      contentType,
      bufferBytes: buf.length,
      parseFejl: err instanceof Error ? err.message : String(err),
    });
  }
}
