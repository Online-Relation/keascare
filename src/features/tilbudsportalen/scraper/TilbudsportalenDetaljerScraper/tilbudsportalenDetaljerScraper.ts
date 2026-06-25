// src/features/tilbudsportalen/scraper/TilbudsportalenDetaljerScraper/tilbudsportalenDetaljerScraper.ts

import axios from 'axios';
import { load } from 'cheerio';
import type { TilbudsportalenDetalje } from '@/features/tilbudsportalen/types/tilbudsportalen.types';
import { TP_DELAY_MS, TP_BROWSER_HEADERS } from '@/features/tilbudsportalen/constants/TilbudsportalenConstants';
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

function findLabelVærdi($: ReturnType<typeof load>, label: string): string | null {
  let værdi: string | null = null;
  $('*').each((_, el) => {
    const tekst = $(el).text().trim();
    if (tekst === label) {
      const næste = $(el).next();
      if (næste.length) {
        const kandidat = næste.text().trim();
        if (kandidat) { værdi = kandidat; return false; }
      }
      const forælder = $(el).parent();
      const søskende = forælder.next();
      if (søskende.length) {
        const kandidat = søskende.text().trim();
        if (kandidat) { værdi = kandidat; return false; }
      }
    }
  });
  return værdi;
}

function parseDetalje(html: string, tilbudsid: string, afdelingsid: string): TilbudsportalenDetalje {
  const $ = load(html);
  const bodyTekst = $('body').text();

  // CVR — prøv label-baseret parsing
  let cvr: string | null = null;
  $('h4.h5, dt, th, strong, b').each((_, el) => {
    if ($(el).text().includes('CVR-nummer') || $(el).text().includes('CVR')) {
      const kandidat = $(el).next().text().trim() || $(el).parent().next().text().trim();
      const cvrMatch = kandidat.match(/\d{8}/);
      if (cvrMatch) { cvr = cvrMatch[0]; return false; }
    }
  });
  // Fallback: søg efter 8-cifret CVR-mønster i tekst efter "CVR"
  if (!cvr) {
    const cvrMatch = bodyTekst.match(/CVR[^0-9]*(\d{8})/i);
    if (cvrMatch) cvr = cvrMatch[1];
  }

  // P-nummer
  let pNummer: string | null = null;
  const pMatch = bodyTekst.match(/P-nummer[^0-9]*(\d{10})/i);
  if (pMatch) pNummer = pMatch[1];

  // Tilbudstype — hent første § 10X fra h3
  let tilbudstype: string | null = null;
  $('h3.h5, h3, h4').each((_, el) => {
    const tekst = $(el).text().trim();
    if (tekst.match(/§\s*10[0-9]/) && !tilbudstype) {
      tilbudstype = tekst;
    }
  });

  // Pladser — find første "N pladser" i tekst
  let pladser: number | null = null;
  const pladsMatch = bodyTekst.match(/(\d+)\s+pladser/i);
  if (pladsMatch) {
    const parsed = parseInt(pladsMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 1000) pladser = parsed;
  }

  // Kommune — fra "Driftsaftale med" tekst
  let kommune: string | null = null;
  const kommuneMatch = bodyTekst.match(/Driftsaftale med\s*\n?\s*([^\n]+)/i);
  if (kommuneMatch) kommune = kommuneMatch[1].trim() || null;

  // Email — find mailto-link
  let email: string | null = null;
  $('a[href^="mailto:"]').each((_, el) => {
    if (!email) email = $(el).attr('href')?.replace('mailto:', '').trim() ?? null;
  });
  if (!email) {
    const emailMatch = bodyTekst.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];
  }

  // Telefon — 8-cifret dansk telefonnummer
  let telefon: string | null = null;
  const telMatch = bodyTekst.match(/(?:Telefon|Tlf\.?)[:\s]*([0-9\s]{8,11})/i);
  if (telMatch) telefon = telMatch[1].replace(/\s/g, '').substring(0, 8) || null;

  // Kontaktperson — tekst efter "Kontaktperson" label
  let kontaktperson: string | null = findLabelVærdi($, 'Kontaktperson');
  if (kontaktperson && kontaktperson.length > 60) kontaktperson = null;

  return { tilbudsid, afdelingsid, cvr, tilbudstype, pladser, pNummer, kommune, kontaktperson, telefon, email };
}

export async function scraperTilbudsportalenDetaljer(batch = 30): Promise<DetaljerResultat> {
  const client = axios.create({
    timeout: 20_000,
    headers: TP_BROWSER_HEADERS,
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
      await gemDetaljer({ tilbudsid, afdelingsid, cvr: null, tilbudstype: null, pladser: null, pNummer: null, kommune: null, kontaktperson: null, telefon: null, email: null });
    }

    if (i < rækker.length - 1) await venteMs(TP_DELAY_MS);
  }

  return { behandlet, fejl, fejlBeskeder };
}
