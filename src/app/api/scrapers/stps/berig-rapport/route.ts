// Henter STPS-detaljer (PDF, tilsynsform, fund) for ét specifikt bosted.
// Bruges som "Hent STPS detaljer nu"-knap på bosteds-siden.

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as https from 'https';
import { load } from 'cheerio';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { parsePdfFraUrl } from '@/features/stps/scraper/StpsPdfParser';
import { STPS_HTTP_CONFIG } from '@/features/stps/constants/StpsConstants';

const HTTP_CLIENT = axios.create({
  timeout: 20_000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: {
    'User-Agent': STPS_HTTP_CONFIG.headers['User-Agent'],
    Accept: 'text/html,application/xhtml+xml',
  },
});

function udtraekPdfUrl(html: string): string | null {
  const $ = load(html);
  return $('a[href*="gopublic.dk"][href$=".pdf"], a[href*="cdn"][href$=".pdf"]')
    .first()
    .attr('href') ?? null;
}

export async function POST(req: NextRequest) {
  const { bostedId } = await req.json() as { bostedId: string };
  if (!bostedId) return NextResponse.json({ ok: false, fejl: 'bostedId kræves' }, { status: 400 });

  const supabase = getSupabaseServerClient();

  const { data: bosted } = await supabase
    .from('stps_rapporter')
    .select('id, rapport_url, stps_tilbud_navn')
    .eq('id', bostedId)
    .maybeSingle();

  if (!bosted?.rapport_url || bosted.rapport_url.startsWith('manuel:')) {
    return NextResponse.json({ ok: false, fejl: 'Dette bosted har ingen direkte STPS rapport-URL — tilsynsform skal udfyldes manuelt' });
  }

  try {
    const response = await HTTP_CLIENT.get<string>(bosted.rapport_url, { responseType: 'text' });
    const pdfUrl = udtraekPdfUrl(response.data);

    if (!pdfUrl) {
      await supabase.from('stps_rapporter').update({ pdf_behandlet: true }).eq('id', bostedId);
      return NextResponse.json({ ok: true, besked: 'Ingen PDF fundet på STPS-siden' });
    }

    const detaljer = await parsePdfFraUrl(pdfUrl);

    await supabase.from('stps_rapporter').update({
      pdf_url:      pdfUrl,
      pdf_vurdering: detaljer.vurdering,
      pdf_fund:     detaljer.fund,
      cvr:          detaljer.cvr ?? bosted.stps_tilbud_navn,
      adresse:      detaljer.adresse,
      pladser:      detaljer.pladser,
      p_nummer:     detaljer.pNummer,
      fund_items:   detaljer.fundItems.length > 0 ? detaljer.fundItems : null,
      pdf_behandlet: true,
    }).eq('id', bostedId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, fejl: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
