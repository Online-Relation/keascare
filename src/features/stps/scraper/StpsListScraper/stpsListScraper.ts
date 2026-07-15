// src/features/stps/scraper/StpsListScraper/stpsListScraper.ts

import axios, { type AxiosInstance } from 'axios';
import { load } from 'cheerio';
import * as https from 'https';
import type { StpsListeItem } from '@/features/stps/types/stps.types';
import {
  STPS_LISTING_URL,
  STPS_HTTP_CONFIG,
  SCRAPER_DELAY_MS,
} from '@/features/stps/constants/StpsConstants';

const MODULE_ID = 'gb_d3661996-7e72-4e6f-8f1a-d62c963c73a0';

// Filter-ID for "Bosted" i STPS' behandlingssted-dropdown
const BOSTED_KATEGORISERING_ID = '44dc50a9-28b7-40fd-9bad-1b5e62aa712d';

type GbapiSvar = {
  pageHtml: string;
  totalResultCount: Record<string, number>;
  additionalData: unknown;
};

type ScraperSession = {
  client: AxiosInstance;
  config: unknown;
};

function venteMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Henter siden for at få den fulde data-config og session-cookies.
// Serveren afviser forenklet config — den fulde config fra siden er påkrævet.
async function opretSession(): Promise<ScraperSession> {
  const cookieJar: Record<string, string> = {};

  const baseClient = axios.create({
    timeout: STPS_HTTP_CONFIG.timeout,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: {
      'User-Agent': STPS_HTTP_CONFIG.headers['User-Agent'],
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const pageResponse = await baseClient.get<string>(STPS_LISTING_URL, {
    responseType: 'text',
  });

  // Udtræk cookies fra response headers
  const rawCookies = pageResponse.headers['set-cookie'] ?? [];
  for (const raw of rawCookies) {
    const [pair] = raw.split(';');
    const [name, value] = pair.split('=');
    if (name && value) cookieJar[name.trim()] = value.trim();
  }

  // Udtræk den fulde data-config fra siden
  const html = pageResponse.data;
  const match = html.match(/data-config="([^"]+)"/);
  if (!match) throw new Error('Kunne ikke finde data-config på STPS listeside');

  const decoded = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&#xA;/g, '\n')
    .replace(/&amp;/g, '&');

  const config = JSON.parse(decoded);

  const cookieString = Object.entries(cookieJar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

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

// Konverter DD-MM-YYYY → YYYY-MM-DD (Postgres DATE format)
function normaliserDato(dato: string): string {
  if (!dato) return '';
  const ddmmyyyy = dato.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  return dato.substring(0, 10); // Antag allerede ISO-format
}

function parseItemsFromHtml(html: string): StpsListeItem[] {
  const $ = load(html);
  const resultater: StpsListeItem[] = [];

  $('.item').each((_, el) => {
    // Prøv alle kendte URL-placeringer
    const detailUrl =
      $(el).attr('data-url') ||
      $(el).find('[data-url]').first().attr('data-url') ||
      $(el).find('a[href]').first().attr('href') ||
      $(el).find('.heading a, h2 a, h3 a').first().attr('href') ||
      '';

    // Prøv alle kendte navn-placeringer
    const navn =
      $(el).find('.heading a, h2 a, h3 a').first().text().trim() ||
      $(el).find('.heading, h2, h3').first().text().trim() ||
      $(el).find('a').first().text().trim();

    if (!navn) return; // Spring over hvis vi ikke kan finde et navn

    // STPS HTML-struktur (bekræftet fra detailside):
    //   <heading>Bostedsnavn</heading>
    //   <small>07-07-2026</small>          ← publikationsdato (som TEKST)
    //   <tags>...</tags>
    //   <p>Dato for tilsynsbesøget: 21-05-2026</p>  ← besøgsdato
    //
    // Strategi: udtræk ALLE DD-MM-YYYY fra item-teksten, adskil besøgsdato fra publikationsdato

    const itemTekst = $(el).text();

    // Besøgsdato: datoen direkte efter "tilsynsbesøget"
    const besoegsDatoMatch = itemTekst.match(/tilsynsbes[øo]get[^0-9]*(\d{2}-\d{2}-\d{4})/i);
    const besoegsDato = besoegsDatoMatch?.[1] ?? null;

    // Publikationsdato: den FØRSTE DD-MM-YYYY i teksten der IKKE er besøgsdatoen
    // (den vises som tekst direkte under titlen, altså tidligst i item-teksten)
    const alleDatoer = [...itemTekst.matchAll(/(\d{2}-\d{2}-\d{4})/g)].map(m => m[1]);
    const rapportDatoRå = alleDatoer.find(d => d !== besoegsDato) ?? alleDatoer[0] ?? '';
    const rapportDato = normaliserDato(rapportDatoRå);

    console.log(`[STPS] "${navn}": alleDatoer=${JSON.stringify(alleDatoer)} → rapport="${rapportDatoRå}" besøg="${besoegsDato}"`);

    const tags: string[] = [];
    $(el).find('.labels .label, .tags .tag, [class*="label"], [class*="tag"]').each((_, tagEl) => {
      const tekst = $(tagEl).text().trim();
      // Undgå at medtage store tekstblokke (kun korte tags)
      if (tekst && tekst.length < 60) tags.push(tekst);
    });

    // Brug URL hvis tilgængelig — ellers generer en stabil nøgle fra navn+dato
    const finalUrl = detailUrl ||
      `stps://genereret/${encodeURIComponent(navn)}${rapportDato ? `/${rapportDato}` : ''}`;

    resultater.push({ navn, rapportDato, tags, detailUrl: finalUrl, besoegsDato: besoegsDato ? normaliserDato(besoegsDato) : null });
  });

  return resultater;
}

const MAKS_FORSØG = 3;

async function hentSide(
  client: AxiosInstance,
  config: unknown,
  side: number
): Promise<GbapiSvar> {
  const userInput = {
    query: '',
    months: [],
    categorizations: [BOSTED_KATEGORISERING_ID],
    additionalFilters: {},
    template: 'All',
    page: side,
    moduleId: MODULE_ID,
  };

  const payload = {
    config,
    page: side,
    userInput,
    lastGroupName: '',
    rootFolders: null,
  };

  let sidsteFejl: unknown;
  for (let forsøg = 1; forsøg <= MAKS_FORSØG; forsøg++) {
    try {
      const svar = await client.post<GbapiSvar>(
        'https://stps.dk/gbapi/search/getPage',
        payload
      );
      return svar.data;
    } catch (err) {
      sidsteFejl = err;
      const ventetid = forsøg * 1000;
      console.warn(`[STPS] Side ${side} fejlede (forsøg ${forsøg}/${MAKS_FORSØG}), venter ${ventetid}ms: ${err instanceof Error ? err.message : String(err)}`);
      await venteMs(ventetid);
    }
  }
  throw sidsteFejl;
}

export async function scraperListeSider(maxSider = 10): Promise<StpsListeItem[]> {
  const { client, config } = await opretSession();
  const alle: StpsListeItem[] = [];
  const fejledeSider: number[] = [];
  let totalSider = maxSider;

  for (let side = 1; side <= Math.min(maxSider, totalSider); side++) {
    try {
      const data = await hentSide(client, config, side);

      const items = parseItemsFromHtml(data.pageHtml);
      console.log(`[STPS] Side ${side}: ${items.length} items`);

      if (items.length > 0) {
        alle.push(...items);
      } else {
        console.warn(`[STPS] Side ${side} returnerede 0 items — fortsætter alligevel`);
        fejledeSider.push(side);
      }

      // Opdater totalSider fra første side
      if (side === 1) {
        const totalCount =
          data.totalResultCount['All'] ??
          Object.values(data.totalResultCount).reduce((s, n) => s + n, 0);
        if (totalCount > 0) {
          totalSider = Math.min(maxSider, Math.ceil(totalCount / 10));
          console.log(`[STPS] Total: ${totalCount} resultater → ${totalSider} sider`);
        }
      }
    } catch (err) {
      console.error(`[STPS] Side ${side} fejlede efter ${MAKS_FORSØG} forsøg:`, err instanceof Error ? err.message : String(err));
      fejledeSider.push(side);
    }

    if (side < totalSider) await venteMs(SCRAPER_DELAY_MS);
  }

  if (fejledeSider.length > 0) {
    console.warn(`[STPS] Fejlede sider: ${fejledeSider.join(', ')}`);
  }

  console.log(`[STPS] Færdig: ${alle.length} items hentet (${fejledeSider.length} sider fejlede)`);
  return alle;
}
