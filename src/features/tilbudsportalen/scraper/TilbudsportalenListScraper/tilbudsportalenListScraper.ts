// src/features/tilbudsportalen/scraper/TilbudsportalenListScraper/tilbudsportalenListScraper.ts

import axios from 'axios';
import { load } from 'cheerio';
import type { TilbudsportalenListeItem } from '@/features/tilbudsportalen/types/tilbudsportalen.types';
import {
  TP_LISTE_URL,
  TP_DETALJE_URL,
  TP_AKTIV_MENUPUNKT,
  TP_RESULTATER_PR_SIDE,
  TP_DELAY_MS,
  TP_BROWSER_HEADERS,
  TP_FILTER_PARAMS,
} from '@/features/tilbudsportalen/constants/TilbudsportalenConstants';

export type ListeResultat = {
  hentet: number;
  sider: number;
  fejl: string[];
};

function venteMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseListeSide(html: string): TilbudsportalenListeItem[] {
  const $ = load(html);
  const items: TilbudsportalenListeItem[] = [];

  // Prøv specifik klasse, fall back til enhver link med tilbudDetaljeside i href
  const selector = $('a.linkUdenUnderstreg[href*="tilbudDetaljeside"]').length > 0
    ? 'a.linkUdenUnderstreg[href*="tilbudDetaljeside"]'
    : 'a[href*="tilbudDetaljeside"], a[href*="tilbudsid"]';

  $(selector).each((_, el) => {
    const href = $(el).attr('href') ?? '';
    const url = new URL(href, 'https://tilbudsportalen.dk');
    const tilbudsid = url.searchParams.get('tilbudsid') ?? '';
    const afdelingsid = url.searchParams.get('afdelingsid') ?? '';

    if (!tilbudsid || !afdelingsid) return;

    const navn = $(el).find('h3').first().text().trim();
    if (!navn) return;

    const detaljeUrl = `${TP_DETALJE_URL}?tilbudsid=${tilbudsid}&afdelingsid=${afdelingsid}&aktivtMenupunkt=${TP_AKTIV_MENUPUNKT}`;

    items.push({ tilbudsid, afdelingsid, navn, url: detaljeUrl });
  });

  return items;
}

export async function scraperTilbudsportalenListe(maxSider = 50): Promise<ListeResultat> {
  const client = axios.create({
    timeout: 20_000,
    headers: TP_BROWSER_HEADERS,
    maxRedirects: 5,
  });

  const alle: TilbudsportalenListeItem[] = [];
  const fejl: string[] = [];
  let cookieStr = '';

  // Hent cookies fra første request (med §107+§108 filter)
  const init = await client.get<string>(`${TP_LISTE_URL}?${TP_FILTER_PARAMS}&offset=0`, { responseType: 'text' });
  const rawCookies = init.headers['set-cookie'] ?? [];
  cookieStr = rawCookies.map((c: string) => c.split(';')[0]).join('; ');

  const initHtml = load(init.data);
  // Prøv hidden input, ellers parse fra synlig tekst "X resultater"
  const hiddenTotal = initHtml('input[name="totalResultater"]').first().val() as string | undefined;
  let total = hiddenTotal ? parseInt(hiddenTotal, 10) : 0;
  if (!total) {
    const match = (init.data as string).match(/(\d[\d.]+)\s+resultater/);
    if (match) total = parseInt(match[1].replace(/\./g, ''), 10);
  }
  const antalSider = Math.min(maxSider, Math.ceil(total / TP_RESULTATER_PR_SIDE));

  const items = parseListeSide(init.data);
  alle.push(...items);

  for (let side = 2; side <= antalSider; side++) {
    const offset = (side - 1) * TP_RESULTATER_PR_SIDE;
    try {
      const res = await client.get<string>(
        `${TP_LISTE_URL}?${TP_FILTER_PARAMS}&offset=${offset}`,
        { responseType: 'text', headers: { Cookie: cookieStr } },
      );
      alle.push(...parseListeSide(res.data));
      await venteMs(TP_DELAY_MS);
    } catch (err) {
      fejl.push(`Side ${side}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const { gemListeItems } = await import('@/features/tilbudsportalen/repository/TilbudsportalenRepository');
  await gemListeItems(alle);

  return { hentet: alle.length, sider: antalSider, fejl };
}
