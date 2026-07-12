// Henter STPS-detaljer for ét specifikt bosted.
// Strategi 1: Har bostedet en rigtig STPS-URL → scrape den direkte.
// Strategi 2: Manuel eller ingen URL → søg i egne data via CVR/P-nummer.

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
    .select('id, rapport_url, cvr, p_nummer')
    .eq('id', bostedId)
    .maybeSingle();

  if (!bosted) return NextResponse.json({ ok: false, fejl: 'Bosted ikke fundet' }, { status: 404 });

  const erManuel = !bosted.rapport_url || bosted.rapport_url.startsWith('manuel:');

  // Strategi 2: Ingen rigtig STPS-URL — søg via CVR/P-nummer i egne data
  if (erManuel) {
    if (!bosted.cvr && !bosted.p_nummer) {
      return NextResponse.json({ ok: false, fejl: 'Ingen CVR eller P-nummer — kan ikke slå op i STPS-rapporter' });
    }

    // Find seneste STPS-rapport i databasen med samme CVR eller P-nummer
    let query = supabase
      .from('stps_rapporter')
      .select('rapport_url, pdf_url, pdf_vurdering, pdf_fund, tilsynsform, stps_konklusion, fokus_omraader, temaer, fund_items, rapport_dato, besoeg_dato, region, kommune')
      .neq('id', bostedId)
      .eq('pdf_behandlet', true)
      .order('rapport_dato', { ascending: false })
      .limit(1);

    if (bosted.cvr) {
      query = query.eq('cvr', bosted.cvr);
    } else {
      query = query.eq('p_nummer', bosted.p_nummer);
    }

    const { data: match } = await query.maybeSingle();

    if (!match) {
      return NextResponse.json({ ok: false, fejl: `Ingen STPS-rapport fundet i databasen for CVR ${bosted.cvr ?? bosted.p_nummer} — rapporten hentes automatisk natten over` });
    }

    await supabase.from('stps_rapporter').update({
      rapport_url:    match.rapport_url,
      pdf_url:        match.pdf_url,
      pdf_vurdering:  match.pdf_vurdering,
      pdf_fund:       match.pdf_fund,
      tilsynsform:    match.tilsynsform,
      stps_konklusion: match.stps_konklusion,
      fokus_omraader: match.fokus_omraader,
      temaer:         match.temaer,
      fund_items:     match.fund_items,
      rapport_dato:   match.rapport_dato,
      besoeg_dato:    match.besoeg_dato,
      region:         match.region,
      kommune:        match.kommune,
      pdf_behandlet:  true,
    }).eq('id', bostedId);

    return NextResponse.json({ ok: true });
  }

  // Strategi 1: Rigtig STPS-URL — scrape detaljesiden
  try {
    const response = await HTTP_CLIENT.get<string>(bosted.rapport_url, { responseType: 'text' });
    const pdfUrl = udtraekPdfUrl(response.data);

    if (!pdfUrl) {
      await supabase.from('stps_rapporter').update({ pdf_behandlet: true }).eq('id', bostedId);
      return NextResponse.json({ ok: true, besked: 'Ingen PDF fundet på STPS-siden' });
    }

    const detaljer = await parsePdfFraUrl(pdfUrl);

    await supabase.from('stps_rapporter').update({
      pdf_url:       pdfUrl,
      pdf_vurdering: detaljer.vurdering,
      pdf_fund:      detaljer.fund,
      cvr:           detaljer.cvr,
      adresse:       detaljer.adresse,
      pladser:       detaljer.pladser,
      p_nummer:      detaljer.pNummer,
      fund_items:    detaljer.fundItems.length > 0 ? detaljer.fundItems : null,
      pdf_behandlet: true,
    }).eq('id', bostedId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, fejl: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
