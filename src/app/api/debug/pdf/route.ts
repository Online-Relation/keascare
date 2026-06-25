// src/app/api/debug/pdf/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();

  // Hent én rapport med kritiske fund som har en pdf_url
  const { data } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, pdf_url, pdf_vurdering, pdf_fund')
    .not('pdf_url', 'is', null)
    .eq('pdf_behandlet', true)
    .limit(1)
    .single();

  if (!data?.pdf_url) {
    return NextResponse.json({ fejl: 'Ingen rapport med pdf_url fundet' });
  }

  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ url: data.pdf_url });
    const resultat = await parser.getText();
    const tekst: string = resultat.text ?? '';

    return NextResponse.json({
      id: data.id,
      navn: data.stps_tilbud_navn,
      pdfUrl: data.pdf_url,
      pdf_vurdering: data.pdf_vurdering,
      pdf_fund: data.pdf_fund,
      tekstLængde: tekst.length,
      // Første 3000 tegn så vi kan se hvad der faktisk er i PDF'en
      tekstStart: tekst.substring(0, 3000),
    });
  } catch (err) {
    return NextResponse.json({ fejl: String(err) });
  }
}
