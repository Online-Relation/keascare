// src/features/los/scraper/LosListScraper/losListScraper.ts

import axios from 'axios';
import { load } from 'cheerio';
import type { LosListeItem } from '@/features/los/types/los.types';

const LOS_BASE = 'https://www.los.dk';
const LOS_FIND_URL = `${LOS_BASE}/find-tilbud/`;
const DELAY_MS = 600;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'da-DK,da;q=0.9,en;q=0.7',
};

const PARAGRAPH_LABELS: Record<string, string> = {
  '1': '§43',
  '2': '§107',
  '7': '§108',
};

function venteMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMedlemLinks(html: string, tilbudstype: string): LosListeItem[] {
  const $ = load(html);
  const items: LosListeItem[] = [];

  // LOS member cards are links or divs with href pointing to /find-tilbud/<slug>/
  $('a[href*="/find-tilbud/"]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    // Exclude the list page itself and filter pages
    if (!href.match(/\/find-tilbud\/[^?#]+\/$/)) return;

    const url = href.startsWith('http') ? href : `${LOS_BASE}${href}`;
    const slug = href.replace(/.*\/find-tilbud\//, '').replace(/\/$/, '');
    if (!slug || slug.includes('?')) return;

    const navn = $(el).text().trim() || $(el).find('h2, h3, .title').first().text().trim();
    if (!navn) return;

    // Deduplicate by slug
    if (items.some((i) => i.los_id === slug)) return;

    items.push({ los_id: slug, navn, url, tilbudstyper: [tilbudstype] });
  });

  return items;
}

async function scraperEnType(fwpValue: string, tilbudstype: string, client: ReturnType<typeof axios.create>): Promise<{ items: LosListeItem[]; fejl: string[] }> {
  const items: LosListeItem[] = [];
  const fejl: string[] = [];
  let side = 1;
  let fortsæt = true;

  while (fortsæt) {
    const url = side === 1
      ? `${LOS_FIND_URL}?fwp_member_offers=${fwpValue}`
      : `${LOS_FIND_URL}?fwp_member_offers=${fwpValue}&fwp_paged=${side}`;

    try {
      const res = await client.get<string>(url, { responseType: 'text' });
      const sidensItems = parseMedlemLinks(res.data, tilbudstype);

      if (sidensItems.length === 0) {
        fortsæt = false;
      } else {
        // Merge — add items not already found
        for (const item of sidensItems) {
          if (!items.some((i) => i.los_id === item.los_id)) {
            items.push(item);
          }
        }
        // Check if there's a next page link
        const $ = load(res.data);
        const harNæste = $('a.fwp-page-link').last().text().trim() !== '' && $('a[data-page]').length > 0;
        if (!harNæste || side >= 20) fortsæt = false;
        else {
          side++;
          await venteMs(DELAY_MS);
        }
      }
    } catch (err) {
      fejl.push(`${tilbudstype} side ${side}: ${err instanceof Error ? err.message : String(err)}`);
      fortsæt = false;
    }
  }

  return { items, fejl };
}

export async function scraperLosListe(): Promise<{ items: LosListeItem[]; fejl: string[] }> {
  const client = axios.create({ timeout: 20_000, headers: HEADERS, maxRedirects: 5 });
  const alleItems: LosListeItem[] = [];
  const alleFejl: string[] = [];

  for (const [fwpValue, label] of Object.entries(PARAGRAPH_LABELS)) {
    const { items, fejl } = await scraperEnType(fwpValue, label, client);
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
