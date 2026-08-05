// src/app/api/pdf/route.ts
// Genererer en signed URL til en PDF i Supabase Storage og redirecter til den.
// Bruges i stedet for direkte public URL så bucket ikke behøver at være public.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Mangler ?id=' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // Hent pdf_storage_url og pdf_url fra DB
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('pdf_storage_url, pdf_url')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Rapport ikke fundet' }, { status: 404 });
  }

  // Forsøg signed URL fra Supabase Storage
  if (data.pdf_storage_url) {
    // Udtræk filnavn fra storage-URL
    const urlParts = data.pdf_storage_url.split('/');
    const filnavn = urlParts[urlParts.length - 1];

    const { data: signedData, error: signFejl } = await supabase.storage
      .from('stps-pdfer')
      .createSignedUrl(filnavn, 60 * 60); // 1 times gyldighed

    if (!signFejl && signedData?.signedUrl) {
      return NextResponse.redirect(signedData.signedUrl);
    }

    // Fallback: prøv direkte public URL
    return NextResponse.redirect(data.pdf_storage_url);
  }

  // Ingen storage-URL — redirect til original STPS-URL
  if (data.pdf_url?.startsWith('http')) {
    return NextResponse.redirect(data.pdf_url);
  }

  return NextResponse.json({ error: 'Ingen PDF tilgængelig' }, { status: 404 });
}
