// Søger STPS efter tilsynsrapporter for et specifikt CVR-nummer.
// Bruges når vi manuelt linker en Monday-kunde til et bosted via CVR.

import axios from 'axios';
import { load } from 'cheerio';
import * as https from 'https';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { parsePdfFraUrl } from '@/features/stps/scraper/StpsPdfParser';
import {
  STPS_LISTING_URL,
  STPS_HTTP_CONFIG,
  SCRAPER_DELAY_MS,
} from '@/features/stps/constants/StpsConstants';

const MODULE_ID = 'gb_d3661996-7e72-4e6f-8f1a-d62c963c73a0';
const BOSTED_KATEGORISERING_ID = '44dc50a9-28b7-40fd-9bad-1b5e62aa712d';

type GbapiSvar = { pageHtml: string; totalResultCount: Record<string, number> };

function venteMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function udtraekPdfUrl(html: string): string | null {
  const $ = load(html);
  return $('a[href*="gopublic.dk"][href$=".pdf"], a[href*="cdn"][href$=".pdf"]').first().attr('href') ?? null;
}

async function opretSession() {
  const cookieJar: Record<string, string> = {};

  const baseClient = axios.create({
    timeout: STPS_HTTP_CONFIG.timeout,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: { 'User-Agent': STPS_HTTP_CONFIG.headers['User-Agent'], Accept: 'text/html,application/xhtml+xml' },
  });

  const pageResponse = await baseClient.get<string>(STPS_LISTING_URL, { responseType: 'text' });

  for (const raw of pageResponse.headers['set-cookie'] ?? []) {
    const [pair] = raw.split(';');
    const [name, value] = pair.split('=');
    if (name && value) cookieJar[name.trim()] = value.trim();
  }

  const match = pageResponse.data.match(/data-config="([^"]+)"/);
  if (!match) throw new Error('Kunne ikke finde data-config på STPS listeside');

  const config = JSON.parse(
    match[1].replace(/&quot;/g, '"').replace(/&#xA;/g, '\n').replace(/&amp;/g, '&')
  );

  const cookieString = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');

  const client = axios.create({
    timeout: STPS_HTTP_CONFIG.timeout,
    headers: {
      'User-Agent': STPS_HTTP_CONFIG.headers['User-Agent'],
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Referer: STPS_LISTING_URL,
      gp_currentpage: STPS_LISTING_URL,
      Cookie: cookieString,
    },
  });

  return { client, config };
}

export type StpsCvrSøgResultat = {
  fundet: number;
  gemt: number;
  fejl: string[];
};

export async function søgStpsForCvr(cvr: string, bostedId: string): Promise<StpsCvrSøgResultat> {
  const supabase = getSupabaseServerClient();
  const fejl: string[] = [];
  let gemt = 0;

  const { client, config } = await opretSession();

  // Søg STPS på CVR-nummer som fritekst
  const payload = {
    config,
    page: 1,
    userInput: {
      query: cvr,
      months: [],
      categorizations: [BOSTED_KATEGORISERING_ID],
      additionalFilters: {},
      template: 'All',
      page: 1,
      moduleId: MODULE_ID,
    },
    lastGroupName: '',
    rootFolders: null,
  };

  const svar = await client.post<GbapiSvar>('https://stps.dk/gbapi/search/getPage', payload);
  const $ = load(svar.data.pageHtml);

  const httpClient = axios.create({
    timeout: 20_000,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: { 'User-Agent': STPS_HTTP_CONFIG.headers['User-Agent'], Accept: 'text/html,application/xhtml+xml' },
  });

  const items: Array<{ navn: string; rapportDato: string; detailUrl: string }> = [];
  $('.item').each((_, el) => {
    const detailUrl = $(el).attr('data-url') || $(el).find('a').first().attr('href') || '';
    const navn = $(el).find('.heading a, h2 a').first().text().trim();
    const rapportDato = $(el).find('.datetime').attr('data-date')?.substring(0, 10) || '';
    if (detailUrl && navn) items.push({ navn, rapportDato, detailUrl });
  });

  for (const item of items) {
    try {
      await venteMs(SCRAPER_DELAY_MS);

      // Hent detailside → find PDF
      const detailRes = await httpClient.get<string>(item.detailUrl, { responseType: 'text' });
      const pdfUrl = udtraekPdfUrl(detailRes.data);

      let pdfData = { cvr: null as string | null, pNummer: null as string | null, adresse: null as string | null, pladser: null as string | null, vurdering: null as string | null, fund: null as string | null };
      if (pdfUrl) {
        const parsed = await parsePdfFraUrl(pdfUrl);
        pdfData = parsed;
      }

      // Bekræft CVR-match fra PDF (hvis PDF har CVR og det ikke matcher, skip)
      if (pdfData.cvr && pdfData.cvr !== cvr) continue;

      const rapportDato = item.rapportDato || new Date().toISOString().slice(0, 10);

      // Tjek om rapporten allerede findes
      const { data: eksisterende } = await supabase
        .from('stps_rapporter')
        .select('id')
        .eq('rapport_url', item.detailUrl)
        .maybeSingle();

      if (eksisterende) {
        // Opdater eksisterende rapport med CVR-link og bostedId
        await supabase.from('stps_rapporter').update({
          cvr,
          monday_item_id: (await supabase.from('stps_rapporter').select('monday_item_id').eq('id', bostedId).single()).data?.monday_item_id,
          ...(pdfUrl ? { pdf_url: pdfUrl, pdf_behandlet: true, pdf_vurdering: pdfData.vurdering, pdf_fund: pdfData.fund, adresse: pdfData.adresse, pladser: pdfData.pladser, p_nummer: pdfData.pNummer } : {}),
        }).eq('id', eksisterende.id);
      } else {
        // Hent monday_item_id fra det oprettede bosted
        const { data: bosted } = await supabase
          .from('stps_rapporter')
          .select('monday_item_id, monday_gruppe, monday_match_dato')
          .eq('id', bostedId)
          .single();

        await supabase.from('stps_rapporter').insert({
          stps_tilbud_navn: item.navn,
          rapport_titel:    item.navn,
          rapport_url:      item.detailUrl,
          rapport_dato:     rapportDato,
          cvr,
          pdf_url:          pdfUrl,
          pdf_behandlet:    !!pdfUrl,
          pdf_vurdering:    pdfData.vurdering,
          pdf_fund:         pdfData.fund,
          adresse:          pdfData.adresse,
          pladser:          pdfData.pladser,
          p_nummer:         pdfData.pNummer,
          monday_item_id:   bosted?.monday_item_id ?? null,
          monday_gruppe:    bosted?.monday_gruppe ?? null,
          monday_match_dato: bosted?.monday_match_dato ?? null,
        });
      }

      gemt++;
    } catch (e) {
      fejl.push(`${item.navn}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Slet den tomme placeholder-rapport vi oprettede ved CVR-link, hvis vi fandt rigtige rapporter
  if (gemt > 0) {
    const { data: placeholder } = await supabase
      .from('stps_rapporter')
      .select('rapport_url')
      .eq('id', bostedId)
      .single();

    if (placeholder?.rapport_url === '') {
      await supabase.from('stps_rapporter').delete().eq('id', bostedId);
    }
  }

  return { fundet: items.length, gemt, fejl };
}
