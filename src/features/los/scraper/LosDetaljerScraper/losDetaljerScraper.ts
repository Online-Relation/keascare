// src/features/los/scraper/LosDetaljerScraper/losDetaljerScraper.ts

import axios from 'axios';
import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { LosMedlem, LosListeItem } from '@/features/los/types/los.types';

const LOS_BASE = 'https://www.los.dk';
const DELAY_MS = 500;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'da-DK,da;q=0.9,en;q=0.7',
};

function venteMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tekstFraLabel($: CheerioAPI, label: string): string | null {
  let result: string | null = null;
  $('strong, b, dt, th, label').each((_, el) => {
    const t = $(el).text().trim().replace(/:$/, '');
    if (t.toLowerCase() === label.toLowerCase()) {
      // Try sibling or next element
      const næste = $(el).next();
      if (næste.length && næste.text().trim()) {
        result = næste.text().trim();
        return false;
      }
      const forælder = $(el).parent();
      const søskende = forælder.children().not(el);
      if (søskende.length && søskende.first().text().trim()) {
        result = søskende.first().text().trim();
        return false;
      }
    }
  });
  return result;
}

function parseAccordionSektion($: CheerioAPI, titel: string): CheerioAPI | null {
  let sektionHtml: string | null = null;
  $('[class*="accordion"], [class*="tab"], details, .faq-item, .single-offer-accordion').each((_, el) => {
    const headerTekst = $(el).find('button, summary, h3, h4, .accordion-title, .tab-title').first().text().trim();
    if (headerTekst.toLowerCase().includes(titel.toLowerCase())) {
      sektionHtml = $(el).html() ?? null;
      return false;
    }
  });
  if (!sektionHtml) return null;
  return load(sektionHtml);
}

function parseListeFra($sek: CheerioAPI, overskrift: string): string[] {
  const items: string[] = [];
  let inSektion = false;
  $sek('*').each((_, el) => {
    const tekst = $sek(el).text().trim();
    if (tekst.toLowerCase().includes(overskrift.toLowerCase())) {
      inSektion = true;
      return;
    }
    if (inSektion) {
      // Stop ved næste overskrift (stærk tekst eller heading)
      const tag = (el as { tagName?: string }).tagName?.toLowerCase() ?? '';
      if (['h2','h3','h4','h5','strong','b'].includes(tag) && !$sek(el).parents('li').length) {
        inSektion = false;
        return;
      }
      if (tag === 'li' || tag === 'span') {
        const t = $sek(el).text().trim();
        if (t && !items.includes(t)) items.push(t);
      }
    }
  });
  return items;
}

function parseDetalje(html: string, item: LosListeItem): LosMedlem {
  const $ = load(html);
  const bodyText = $('body').text();

  // CVR
  let cvr: string | null = null;
  const cvrMatch = bodyText.match(/CVR[^0-9]*(\d{8})/i);
  if (cvrMatch) cvr = cvrMatch[1];

  // Kontakt fra header/hero sektion
  let telefon: string | null = null;
  let email: string | null = null;
  let website: string | null = null;

  $('a[href^="tel:"]').first().each((_, el) => {
    const t = $(el).text().trim();
    telefon = t || ($(el).attr('href')?.replace('tel:', '') ?? null);
  });
  $('a[href^="mailto:"]').first().each((_, el) => {
    const t = $(el).text().trim();
    email = t || ($(el).attr('href')?.replace('mailto:', '') ?? null);
  });
  $('a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (!href.includes('los.dk') && !href.includes('google') && !href.includes('facebook')) {
      website = href;
      return false;
    }
  });

  // Adresse, region, kommune
  let adresse: string | null = null;
  let region: string | null = null;
  let kommune: string | null = null;

  // Forsøg at finde dem ved label-søgning
  $('*').each((_, el) => {
    const tekst = $(el).text().trim();
    if (tekst.startsWith('Region:')) region = tekst.replace('Region:', '').trim();
    if (tekst.startsWith('Kommune:')) kommune = tekst.replace('Kommune:', '').trim();
  });

  // Adresse — typisk en div med gadeadresse + postnr + by
  const adresseMatch = bodyText.match(/(\w[^\n]{3,50})\n\s*(\d{4}\s+\w[^\n]+)/);
  if (adresseMatch) adresse = `${adresseMatch[1].trim()}, ${adresseMatch[2].trim()}`;

  // Accordion: Ydelser og målgrupper
  const $ydelser = parseAccordionSektion($, 'Ydelser og målgrupper');
  let losTilbud: string[] = [];
  let losTillaegsydelser: string[] = [];
  let losMaalgrupper: string[] = [];
  let losDiagnoser: string[] = [];
  let losAldersgrupper: string[] = [];
  let losObsAlder: string | null = null;

  if ($ydelser) {
    losTilbud = parseListeFra($ydelser, 'Tilbud:');
    losTillaegsydelser = parseListeFra($ydelser, 'Tillægsydelser:');
    losMaalgrupper = parseListeFra($ydelser, 'Målgrupper:');
    losDiagnoser = parseListeFra($ydelser, 'Diagnoser:');
    losAldersgrupper = parseListeFra($ydelser, 'Aldersgrupper:');
    const obsMatch = $ydelser('body').text().match(/OBS\s+([\d–\-]+\s*år)/i);
    if (obsMatch) losObsAlder = obsMatch[1];
  }

  // Accordion: Faglig tilgang
  const $faglig = parseAccordionSektion($, 'Faglig tilgang');
  let losFagligTilgang: string | null = null;
  if ($faglig) {
    losFagligTilgang = $faglig('p, div').first().text().trim() || null;
    if (!losFagligTilgang) {
      const al = $faglig('body').text().replace(/Faglig tilgang/i, '').trim();
      losFagligTilgang = al || null;
    }
  }

  // Accordion: Pladser
  const $pladser = parseAccordionSektion($, 'Pladser');
  let losPladser: number | null = null;
  if ($pladser) {
    const pMatch = $pladser('body').text().match(/Pladser:\s*(\d+)/i);
    if (pMatch) losPladser = parseInt(pMatch[1], 10);
  }

  // Accordion: Priser og opsigelse
  const $priser = parseAccordionSektion($, 'Priser og opsigelse');
  let losDagstakst: string | null = null;
  let losAndreTilbudPris: string | null = null;
  let losOpsigelsesvarsel: string | null = null;
  if ($priser) {
    const tekst = $priser('body').text();
    const dagMatch = tekst.match(/Døgntilbud:\s*([\d.,]+)/i);
    if (dagMatch) losDagstakst = dagMatch[1];
    const andreMatch = tekst.match(/Andre sociale tilbud:\s*([^\n]+)/i);
    if (andreMatch) losAndreTilbudPris = andreMatch[1].trim();
    const opsMatch = tekst.match(/Opsigelsesvarsel:\s*([^\n]+)/i);
    if (opsMatch) losOpsigelsesvarsel = opsMatch[1].trim();
  }

  // Accordion: Ledelse og personale
  const $ledelse = parseAccordionSektion($, 'Ledelse og personale');
  let losLeder: string | null = null;
  let losAnsatte: number | null = null;
  let losFuldtidsstillinger: number | null = null;
  let losOrganisationstype: string | null = null;
  let losOprettelsesaar: number | null = null;
  if ($ledelse) {
    const tekst = $ledelse('body').text();
    const lederMatch = tekst.match(/Leder:\s*([^\n]+)/i);
    if (lederMatch) losLeder = lederMatch[1].trim();
    const ansatteMatch = tekst.match(/Antal ansatte:\s*(\d+)/i);
    if (ansatteMatch) losAnsatte = parseInt(ansatteMatch[1], 10);
    const fuldtidMatch = tekst.match(/Fuldtidsstillinger:\s*(\d+)/i);
    if (fuldtidMatch) losFuldtidsstillinger = parseInt(fuldtidMatch[1], 10);
    const orgMatch = tekst.match(/Organisationstype:\s*([^\n]+)/i);
    if (orgMatch) losOrganisationstype = orgMatch[1].trim();
    const aarMatch = tekst.match(/Oprettelsesår:\s*(\d{4})/i);
    if (aarMatch) losOprettelsesaar = parseInt(aarMatch[1], 10);
  }

  return {
    los_id: item.los_id,
    navn: item.navn,
    url: item.url,
    cvr,
    telefon,
    email,
    website,
    adresse,
    region,
    kommune,
    tilbudstyper: item.tilbudstyper,
    los_tilbud: losTilbud,
    los_tillaegsydelser: losTillaegsydelser,
    los_maalgrupper: losMaalgrupper,
    los_diagnoser: losDiagnoser,
    los_aldersgrupper: losAldersgrupper,
    los_obs_alder: losObsAlder,
    los_faglig_tilgang: losFagligTilgang,
    los_pladser: losPladser,
    los_dagstakst: losDagstakst,
    los_andre_tilbud_pris: losAndreTilbudPris,
    los_opsigelsesvarsel: losOpsigelsesvarsel,
    los_leder: losLeder,
    los_ansatte: losAnsatte,
    los_fuldtidsstillinger: losFuldtidsstillinger,
    los_organisationstype: losOrganisationstype,
    los_oprettelsesaar: losOprettelsesaar,
    scraper_dato: new Date().toISOString(),
  };
}

export type DetaljerResultat = { behandlet: number; fejl: number; fejlBeskeder: string[] };

export async function scraperLosDetaljer(max = 100): Promise<DetaljerResultat> {
  const { hentUbehandledeLosItems, gemLosMedlem } = await import('@/features/los/repository/LosRepository');

  const items = await hentUbehandledeLosItems(max);
  if (items.length === 0) return { behandlet: 0, fejl: 0, fejlBeskeder: [] };

  const client = axios.create({ timeout: 20_000, headers: HEADERS, maxRedirects: 5 });
  let behandlet = 0;
  let fejl = 0;
  const fejlBeskeder: string[] = [];

  for (const item of items) {
    const url = item.url.startsWith('http') ? item.url : `${LOS_BASE}${item.url}`;
    try {
      const res = await client.get<string>(url, { responseType: 'text' });
      const medlem = parseDetalje(res.data, item);
      await gemLosMedlem(medlem);
      behandlet++;
    } catch (err) {
      fejl++;
      fejlBeskeder.push(`${item.navn}: ${err instanceof Error ? err.message : String(err)}`);
    }
    await venteMs(DELAY_MS);
  }

  return { behandlet, fejl, fejlBeskeder };
}
