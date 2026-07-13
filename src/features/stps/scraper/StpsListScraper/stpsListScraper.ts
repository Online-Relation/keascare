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

    const rapportDato =
      $(el).find('.datetime').attr('data-date')?.substring(0, 10) ||
      $(el).find('[data-date]').first().attr('data-date')?.substring(0, 10) ||
      $(el).find('.datetime').text().trim() ||
      $(el).find('time').attr('datetime')?.substring(0, 10) ||
      '';

    const tags: string[] = [];
    $(el).find('.labels .label, .tags .tag, [class*="label"], [class*="tag"]').each((_, tagEl) => {
      const tekst = $(tagEl).text().trim();
      // Undgå at medtage store tekstblokke (kun korte tags)
      if (tekst && tekst.length < 60) tags.push(tekst);
    });

    const besoegsTekst = $(el).find('p').text();
    const besoegsDatoMatch = besoegsTekst.match(/(\d{2}-\d{2}-\d{4})/);
    const besoegsDato = besoegsDatoMatch?.[1] ?? null;

    // Brug URL hvis tilgængelig — ellers generer en stabil nøgle fra navn+dato
    const finalUrl = detailUrl ||
      `stps://genereret/${encodeURIComponent(navn)}${rapportDato ? `/${rapportDato}` : ''}`;

    resultater.push({ navn, rapportDato, tags, detailUrl: finalUrl, besoegsDato });
  });

  return resultater;
}

export async function scraperListeSider(maxSider = 10): Promise<StpsListeItem[]> {
  const { client, config } = await opretSession();
  const alle: StpsListeItem[] = [];

  for (let side = 1; side <= maxSider; side++) {
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

    const svar = await client.post<GbapiSvar>(
      'https://stps.dk/gbapi/search/getPage',
      payload
    );

    const items = parseItemsFromHtml(svar.data.pageHtml);
    if (items.length === 0) break;

    alle.push(...items);

    // Brug summen af alle tællere som fallback hvis 'All' mangler
    const totalCount =
      svar.data.totalResultCount['All'] ??
      Object.values(svar.data.totalResultCount).reduce((s, n) => s + n, 0);
    const totalSider = totalCount > 0 ? Math.ceil(totalCount / 10) : maxSider;
    if (side >= totalSider) break;

    if (side < maxSider) await venteMs(SCRAPER_DELAY_MS);
  }

  return alle;
}
