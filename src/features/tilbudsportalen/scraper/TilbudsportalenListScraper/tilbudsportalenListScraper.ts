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
  TP_USER_AGENT,
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

  $('a.linkUdenUnderstreg[href*="tilbudDetaljeside"]').each((_, el) => {
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
    headers: { 'User-Agent': TP_USER_AGENT, Accept: 'text/html' },
    maxRedirects: 5,
  });

  const alle: TilbudsportalenListeItem[] = [];
  const fejl: string[] = [];
  let cookieStr = '';

  // Hent cookies fra første request
  const init = await client.get<string>(TP_LISTE_URL, { responseType: 'text' });
  const rawCookies = init.headers['set-cookie'] ?? [];
  cookieStr = rawCookies.map((c: string) => c.split(';')[0]).join('; ');

  const totalHTML = load(init.data);
  const totalTekst = totalHTML('input[name="totalResultater"]').first().val() as string;
  const total = parseInt(totalTekst ?? '0', 10);
  const antalSider = Math.min(maxSider, Math.ceil(total / TP_RESULTATER_PR_SIDE));

  const items = parseListeSide(init.data);
  alle.push(...items);

  for (let side = 2; side <= antalSider; side++) {
    try {
      const res = await client.get<string>(`${TP_LISTE_URL}?page=${side}`, {
        responseType: 'text',
        headers: { Cookie: cookieStr },
      });
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
