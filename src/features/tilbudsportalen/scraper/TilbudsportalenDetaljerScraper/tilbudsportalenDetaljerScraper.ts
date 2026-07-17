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

  // Pladser — forsøg først "Pladser på hele tilbuddet" (vises øverst på siden),
  // derefter §107+§108 summeret, og til sidst fritekst-fallback.
  let pladser: number | null = null;
  let pladseTotalt: number | null = null;
  let pladser107_108 = 0;
  let pladserAlle = 0;

  // "Pladser på hele tilbuddet" er det mest præcise tal — det dækker alle afdelinger
  const heleMatch = bodyTekst.match(/Pladser p[åa] hele tilbuddet[\s\S]{0,80}?(\d+)\s+pladser/i);
  if (heleMatch) {
    const helePladser = parseInt(heleMatch[1], 10);
    if (helePladser > 0 && helePladser < 2000) pladseTotalt = helePladser;
  }

  $('#pladser').find('div.lh-1').each((_, el) => {
    const paragrafTekst = $(el).find('h3').text();
    const paragrafMatch = paragrafTekst.match(/§\s*(\d+)/i);
    const antalTekst = $(el).find('div').first().text();
    const m = antalTekst.match(/(\d+)/);
    if (!m) return;
    const antal = parseInt(m[1], 10);
    pladserAlle += antal;
    if (paragrafMatch) {
      const paragrafNr = parseInt(paragrafMatch[1], 10);
      if (paragrafNr === 107 || paragrafNr === 108) pladser107_108 += antal;
    }
  });
  if (pladser107_108 > 0 && pladser107_108 < 2000) pladser = pladser107_108;
  if (!pladseTotalt && pladserAlle > 0 && pladserAlle < 2000) pladseTotalt = pladserAlle;
  if (!pladseTotalt) {
    const pladsMatch = bodyTekst.match(/(\d+)\s+pladser/i);
    if (pladsMatch) {
      const parsed = parseInt(pladsMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 1000) pladseTotalt = parsed;
    }
  }
  // Brug helePladser som primært pladser-tal hvis §107/§108-sum mangler
  if (!pladser && pladseTotalt) pladser = pladseTotalt;

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

  // Driftsform — "Virksomhedsform" på detaljeside (Primærkommune, Selvejende institution, Privat, Region…)
  const driftsform: string | null = findLabelVærdi($, 'Virksomhedsform');

  // Tilbuddets adresse — div efter h4 "Tilbuddets adresse" (kan indeholde <br>)
  let tilbuddetsAdresse: string | null = null;
  $('h4').each((_, el) => {
    if ($(el).text().trim() === 'Tilbuddets adresse') {
      const div = $(el).next('div');
      const linjer = div.text().split('\n').map((l: string) => l.trim()).filter(Boolean);
      if (linjer.length) tilbuddetsAdresse = linjer.join(', ');
      return false;
    }
  });

  // Website — <a> i div.hjemmesideOeverigeOplysninger
  const website: string | null = $('div.hjemmesideOeverigeOplysninger a').first().attr('href') ?? null;

  // Tilbuddets leder
  let leder: string | null = findLabelVærdi($, 'Tilbuddets leder');
  if (leder && leder.length > 80) leder = null;

  // Virksomhedens navn
  const virksomhedsNavn: string | null = findLabelVærdi($, 'Virksomhedens navn');

  // Tilsynsførende myndighed
  const tilsynsmyndighed: string | null = findLabelVærdi($, 'Tilsynsførende myndighed');

  // Pladser pr. paragraf — kun §107 og §108; §43 ignoreres
  const pladsePoster: string[] = [];
  $('#pladser').find('div.lh-1').each((_, el) => {
    const paragrafTekst2 = $(el).find('h3').text();
    const paragrafMatch2 = paragrafTekst2.match(/§\s*(\d+\w*)/i);
    if (!paragrafMatch2) return;
    const paragrafNr2 = parseInt(paragrafMatch2[1], 10);
    if (paragrafNr2 !== 107 && paragrafNr2 !== 108) return;
    const antal = $(el).find('div').first().text().match(/(\d+)\s+pladser/i);
    if (antal) pladsePoster.push(`${antal[1]} §${paragrafMatch2[1]}`);
  });
  const pladsePrParagraf: string | null = pladsePoster.length ? pladsePoster.join(', ') : null;

  return {
    tilbudsid, afdelingsid, cvr, tilbudstype, pladser, pNummer, kommune,
    kontaktperson, telefon, email, driftsform,
    tilbuddetsAdresse, leder, website, virksomhedsNavn, tilsynsmyndighed, pladsePrParagraf, pladseTotalt,
  };
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
      await gemDetaljer({ tilbudsid, afdelingsid, cvr: null, tilbudstype: null, pladser: null, pladseTotalt: null, pNummer: null, kommune: null, kontaktperson: null, telefon: null, email: null, driftsform: null, tilbuddetsAdresse: null, leder: null, website: null, virksomhedsNavn: null, tilsynsmyndighed: null, pladsePrParagraf: null });
    }

    if (i < rækker.length - 1) await venteMs(TP_DELAY_MS);
  }

  return { behandlet, fejl, fejlBeskeder };
}
