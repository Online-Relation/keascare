// src/features/stps/scraper/StpsDetaljerScraper/stpsDetaljerScraper.ts

import axios from 'axios';
import { load } from 'cheerio';
import * as https from 'https';
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

export type DetaljerResultat = {
  behandlet: number;
  fejl: number;
  fejlBeskeder: string[];
};

function venteMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function udtraekPdfUrl(html: string): string | null {
  const $ = load(html);
  const href = $('a[href*="gopublic.dk"][href$=".pdf"], a[href*="cdn"][href$=".pdf"]')
    .first()
    .attr('href');
  return href ?? null;
}

export async function kørDetaljerScraper(batchStørrelse = 50): Promise<DetaljerResultat> {
  const supabase = getSupabaseServerClient();
  const fejlBeskeder: string[] = [];
  let behandlet = 0;
  let fejl = 0;

  // Hent alle rapporter der endnu ikke er PDF-behandlet
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, rapport_url, stps_tilbud_navn')
    .eq('pdf_behandlet', false)
    .limit(batchStørrelse);

  if (error) throw new Error(`Supabase fejl: ${error.message}`);
  const rapporter = data ?? [];

  for (let i = 0; i < rapporter.length; i++) {
    const { id, rapport_url, stps_tilbud_navn } = rapporter[i];

    try {
      // 1. Hent detailside for at finde PDF-URL
      const response = await HTTP_CLIENT.get<string>(rapport_url, { responseType: 'text' });
      const pdfUrl = udtraekPdfUrl(response.data);

      if (!pdfUrl) {
        // Ingen PDF fundet — marker som behandlet alligevel
        await supabase.from('stps_rapporter').update({ pdf_behandlet: true }).eq('id', id);
        behandlet++;
        continue;
      }

      // 2. Parse PDF og udtræk detaljer
      const detaljer = await parsePdfFraUrl(pdfUrl);

      // 3. Gem i Supabase
      await supabase.from('stps_rapporter').update({
        pdf_url: pdfUrl,
        pdf_vurdering: detaljer.vurdering,
        pdf_fund: detaljer.fund,
        cvr: detaljer.cvr,
        adresse: detaljer.adresse,
        pladser: detaljer.pladser,
        pdf_behandlet: true,
      }).eq('id', id);

      behandlet++;
    } catch (err) {
      fejl++;
      fejlBeskeder.push(`${stps_tilbud_navn}: ${err instanceof Error ? err.message : String(err)}`);

      // Marker som behandlet selv ved fejl, så vi ikke hænger fast på samme rapport
      await supabase.from('stps_rapporter').update({ pdf_behandlet: true }).eq('id', id).then(() => {});
    }

    if (i < rapporter.length - 1) await venteMs(600);
  }

  return { behandlet, fejl, fejlBeskeder };
}
