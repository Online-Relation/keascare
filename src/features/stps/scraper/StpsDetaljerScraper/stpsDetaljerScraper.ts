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

function udtraekCvrFraHtml(html: string): string | null {
  // CVR vises i STPS detalje-HTML som tekst, f.eks. "CVR-nummer: 12345678"
  const match = html.match(/CVR-?\s*(?:nummer)?:?\s*(\d{8})/i);
  return match?.[1] ?? null;
}

function udtraekPNummerFraHtml(html: string): string | null {
  const match =
    html.match(/P-?\s*nummer:?\s*(\d{10})/i) ??
    html.match(/Produktionsenhed:?\s*(\d{10})/i);
  return match?.[1] ?? null;
}

export async function kørDetaljerScraper(batchStørrelse = 50): Promise<DetaljerResultat> {
  const supabase = getSupabaseServerClient();
  const fejlBeskeder: string[] = [];
  let behandlet = 0;
  let fejl = 0;

  // Prioritér rækker der mangler deltager-data men har pdf_url
  const { data: data1, error: error1 } = await supabase
    .from('stps_rapporter')
    .select('id, rapport_url, pdf_url, stps_tilbud_navn')
    .not('pdf_url', 'is', null)
    .is('tilsyn_deltagere_stps', null)
    .limit(batchStørrelse);

  if (error1) throw new Error(`Supabase fejl: ${error1.message}`);

  // Hent derudover rapporter der ikke er PDF-behandlet (nye rapporter)
  const { data: data2 } = await supabase
    .from('stps_rapporter')
    .select('id, rapport_url, pdf_url, stps_tilbud_navn')
    .eq('pdf_behandlet', false)
    .not('rapport_url', 'ilike', 'stps://genereret/%')
    .limit(batchStørrelse);

  // Slå de to lister sammen og deduplisér på id
  const seenIds = new Set<string>();
  const rapporter = [...(data1 ?? []), ...(data2 ?? [])].filter((r) => {
    if (seenIds.has(r.id)) return false;
    seenIds.add(r.id);
    return true;
  });

  for (let i = 0; i < rapporter.length; i++) {
    const { id, rapport_url, pdf_url: eksisterendePdfUrl, stps_tilbud_navn } = rapporter[i] as { id: string; rapport_url: string; pdf_url: string | null; stps_tilbud_navn: string };

    try {
      let pdfUrl: string | null = eksisterendePdfUrl ?? null;
      let cvrFraHtml: string | null = null;
      let pNummerFraHtml: string | null = null;

      // 1. Hent detailside — kun hvis vi ikke allerede har pdf_url
      if (!pdfUrl && !rapport_url.startsWith('stps://genereret/')) {
        const response = await HTTP_CLIENT.get<string>(rapport_url, { responseType: 'text' });
        const htmlIndhold = response.data;
        cvrFraHtml = udtraekCvrFraHtml(htmlIndhold);
        pNummerFraHtml = udtraekPNummerFraHtml(htmlIndhold);
        pdfUrl = udtraekPdfUrl(htmlIndhold);
      }

      if (!pdfUrl) {
        // Ingen PDF — gem hvad vi fandt i HTML og marker behandlet
        await supabase.from('stps_rapporter').update({
          cvr: cvrFraHtml,
          p_nummer: pNummerFraHtml,
          pdf_behandlet: true,
        }).eq('id', id);
        behandlet++;
        continue;
      }

      // 2. Download PDF-bytes og upload til Supabase Storage
      let pdfStorageUrl: string | null = null;
      try {
        const pdfRes = await fetch(pdfUrl, {
          headers: { 'User-Agent': STPS_HTTP_CONFIG.headers['User-Agent'] },
        });
        if (pdfRes.ok) {
          const pdfBytes = await pdfRes.arrayBuffer();
          const filnavn = `${id}.pdf`;
          const { error: uploadFejl } = await supabase.storage
            .from('stps-pdfer')
            .upload(filnavn, pdfBytes, { contentType: 'application/pdf', upsert: true });
          if (!uploadFejl) {
            const { data: urlData } = supabase.storage.from('stps-pdfer').getPublicUrl(filnavn);
            pdfStorageUrl = urlData?.publicUrl ?? null;
          }
        }
      } catch {
        // Upload-fejl stopper ikke parsing
      }

      // 3. Parse PDF — brug Supabase Storage URL hvis tilgængelig (gopublic.dk blokerer Railway)
      const parseUrl = pdfStorageUrl ?? pdfUrl;
      const detaljer = await parsePdfFraUrl(parseUrl);

      // 4. Gem — CVR fra HTML har forrang hvis PDF-parse fejler
      await supabase.from('stps_rapporter').update({
        pdf_url: pdfUrl,
        pdf_storage_url: pdfStorageUrl,
        pdf_vurdering: detaljer.vurdering,
        pdf_fund: detaljer.fund,
        cvr: detaljer.cvr ?? cvrFraHtml,
        adresse: detaljer.adresse,
        pladser: detaljer.pladser,
        p_nummer: detaljer.pNummer ?? pNummerFraHtml,
        fund_items: detaljer.fundItems.length > 0 ? detaljer.fundItems : null,
        tilsyn_deltagere_stps: detaljer.deltagereStps.length > 0 ? detaljer.deltagereStps : null,
        tilsyn_deltagere_bosted: detaljer.deltagereBosted.length > 0 ? detaljer.deltagereBosted : null,
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
