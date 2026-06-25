// src/features/tilbudsportalen/scraper/TilbudsportalenDetaljerScraper/tilbudsportalenDetaljerScraper.ts

import axios from 'axios';
import { load } from 'cheerio';
import type { TilbudsportalenDetalje } from '@/features/tilbudsportalen/types/tilbudsportalen.types';
import { TP_DELAY_MS, TP_USER_AGENT } from '@/features/tilbudsportalen/constants/TilbudsportalenConstants';
import {
  hentUbehandledeAfdelinger,
  gemDetaljer,
} from '@/features/tilbudsportalen/repository/TilbudsportalenRepository';

export type DetaljerResultat = {
  behandlet: number;
  fejl: number;
  fejlBeskeder: string[];
};

function venteMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDetalje(html: string, tilbudsid: string, afdelingsid: string): TilbudsportalenDetalje {
  const $ = load(html);

  // CVR
  let cvr: string | null = null;
  $('h4.h5').each((_, el) => {
    if ($(el).text().includes('CVR-nummer')) {
      cvr = $(el).next('div').text().trim() || null;
    }
  });

  // Tilbudstype — hent første § 10X fra h3
  let tilbudstype: string | null = null;
  $('h3.h5').each((_, el) => {
    const tekst = $(el).text().trim();
    const match = tekst.match(/§\s*10[0-9]/);
    if (match && !tilbudstype) {
      tilbudstype = tekst;
    }
  });

  // Pladser — find første "N pladser" i tekst
  let pladser: number | null = null;
  const bodyTekst = $('body').text();
  const pladsMatch = bodyTekst.match(/(\d+)\s+pladser/i);
  if (pladsMatch) {
    const parsed = parseInt(pladsMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 1000) pladser = parsed;
  }

  return { tilbudsid, afdelingsid, cvr, tilbudstype, pladser };
}

export async function scraperTilbudsportalenDetaljer(batch = 30): Promise<DetaljerResultat> {
  const client = axios.create({
    timeout: 20_000,
    headers: { 'User-Agent': TP_USER_AGENT, Accept: 'text/html' },
    maxRedirects: 5,
  });

  const rækker = await hentUbehandledeAfdelinger(batch);
  let behandlet = 0;
  let fejl = 0;
  const fejlBeskeder: string[] = [];

  for (let i = 0; i < rækker.length; i++) {
    const { tilbudsid, afdelingsid, tilbudsportalen_url, navn } = rækker[i];
    try {
      const res = await client.get<string>(tilbudsportalen_url, { responseType: 'text' });
      const detalje = parseDetalje(res.data, tilbudsid, afdelingsid);
      await gemDetaljer(detalje);
      behandlet++;
    } catch (err) {
      fejl++;
      fejlBeskeder.push(`${navn}: ${err instanceof Error ? err.message : String(err)}`);
      // Marker som behandlet selv ved fejl
      await gemDetaljer({ tilbudsid, afdelingsid, cvr: null, tilbudstype: null, pladser: null });
    }

    if (i < rækker.length - 1) await venteMs(TP_DELAY_MS);
  }

  return { behandlet, fejl, fejlBeskeder };
}
