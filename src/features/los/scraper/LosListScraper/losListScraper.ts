// src/features/los/scraper/LosListScraper/losListScraper.ts

import axios from 'axios';
import { load } from 'cheerio';
import type { LosListeItem } from '@/features/los/types/los.types';

const LOS_BASE = 'https://www.los.dk';
const FACETWP_AJAX = `${LOS_BASE}/wp-admin/admin-ajax.php`;
const DELAY_MS = 800;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'da-DK,da;q=0.9,en;q=0.7',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Referer': `${LOS_BASE}/find-tilbud/`,
};

// FacetWP-filterværdier for hvert paragraftype
const TILBUDSTYPER: { fwpVærdi: string; label: string }[] = [
  { fwpVærdi: '7', label: '§108' },
  { fwpVærdi: '2', label: '§107' },
  { fwpVærdi: '1', label: '§43'  },
];

function venteMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMedlemLinks(html: string, tilbudstype: string): LosListeItem[] {
  const $ = load(html);
  const items: LosListeItem[] = [];

  $('a[href*="/find-tilbud/"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (!href.match(/\/find-tilbud\/[^?#]+\/$/)) return;

    const url = href.startsWith('http') ? href : `${LOS_BASE}${href}`;
    const slug = href.replace(/.*\/find-tilbud\//, '').replace(/\/$/, '');
    if (!slug || slug.includes('?')) return;

    const navn = $(el).text().trim() || $(el).find('h2, h3, .title').first().text().trim();
    if (!navn || items.some((i) => i.los_id === slug)) return;

    items.push({ los_id: slug, navn, url, tilbudstyper: [tilbudstype] });
  });

  return items;
}

type FacetWpResponse = {
  template?: string;
  settings?: { pager?: { total_pages?: number; per_page?: number; page?: number } };
};

async function scraperEnType(
  fwpVærdi: string,
  tilbudstype: string,
  client: ReturnType<typeof axios.create>,
): Promise<{ items: LosListeItem[]; fejl: string[] }> {
  const items: LosListeItem[] = [];
  const fejl: string[] = [];

  // Byg FacetWP AJAX payload
  function byggPayload(side: number) {
    const data = JSON.stringify({
      facets: { member_offers: [fwpVærdi] },
      frozen_facets: {},
      http_params: {
        get: { fwp_member_offers: fwpVærdi },
        uri: 'find-tilbud',
        url_vars: { fwp_member_offers: fwpVærdi },
      },
      template: 'wp_query',
      extras: { sort: 'default', pagination: { per_page: 10, page: side } },
      soft_refresh: 1,
      is_bfcache: 0,
      first_load: 0,
      paged: side,
    });
    return `action=facetwp_refresh&data=${encodeURIComponent(data)}`;
  }

  // Hent første side for at finde totalt antal sider
  let totalSider = 1;
  try {
    const res = await client.post<FacetWpResponse>(FACETWP_AJAX, byggPayload(1), { responseType: 'json' });
    const json = res.data;
    totalSider = json.settings?.pager?.total_pages ?? 1;
    const html = json.template ?? '';
    const sidensItems = parseMedlemLinks(html, tilbudstype);
    for (const item of sidensItems) {
      if (!items.some((i) => i.los_id === item.los_id)) items.push(item);
    }
  } catch (err) {
    fejl.push(`${tilbudstype} side 1: ${err instanceof Error ? err.message : String(err)}`);
    return { items, fejl };
  }

  // Hent resterende sider
  for (let side = 2; side <= totalSider; side++) {
    await venteMs(DELAY_MS);
    try {
      const res = await client.post<FacetWpResponse>(FACETWP_AJAX, byggPayload(side), { responseType: 'json' });
      const html = res.data.template ?? '';
      const sidensItems = parseMedlemLinks(html, tilbudstype);
      for (const item of sidensItems) {
        if (!items.some((i) => i.los_id === item.los_id)) items.push(item);
      }
    } catch (err) {
      fejl.push(`${tilbudstype} side ${side}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { items, fejl };
}

export async function scraperLosListe(): Promise<{ items: LosListeItem[]; fejl: string[] }> {
  const client = axios.create({ timeout: 20_000, headers: HEADERS, maxRedirects: 5 });
  const alleItems: LosListeItem[] = [];
  const alleFejl: string[] = [];

  for (const { fwpVærdi, label } of TILBUDSTYPER) {
    const { items, fejl } = await scraperEnType(fwpVærdi, label, client);
    alleFejl.push(...fejl);

    for (const item of items) {
      const eks = alleItems.find((i) => i.los_id === item.los_id);
      if (eks) {
        if (!eks.tilbudstyper.includes(label)) eks.tilbudstyper.push(label);
      } else {
        alleItems.push(item);
      }
    }

    await venteMs(DELAY_MS);
  }

  const { gemLosListeItems } = await import('@/features/los/repository/LosRepository');
  await gemLosListeItems(alleItems);

  return { items: alleItems, fejl: alleFejl };
}
