// src/features/stps/scraper/StpsDetailScraper/stpsDetailScraper.ts

import axios from 'axios';
import { load } from 'cheerio';
import type { StpsListeItem, StpsDetailItem } from '@/features/stps/types/stps.types';
import { STPS_HTTP_CONFIG, SCRAPER_DELAY_MS } from '@/features/stps/constants/StpsConstants';
import {
  udtraekSanktioner,
  udtraekFokusOmraader,
  udtraekKommune,
  udtraekRegion,
  udtraekTilsynsform,
  udtraekTemaer,
} from '@/features/stps/mappers/StpsFundMapper';

function venteMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// NOTE: Selectors er estimater – justér efter inspektion af faktisk STPS HTML.
function parseDetailSide(html: string): Omit<StpsDetailItem, 'navn' | 'rapportDato'> {
  const $ = load(html);

  // PDF-link finder vi ved at lede efter cdn1.gopublic.dk eller .pdf i href
  const pdfLink = $(
    'a[href*="gopublic.dk"], a[href*=".pdf"], a[href*="cdn"], .btn:contains("Læs rapporten"), a:contains("Læs rapporten")'
  ).first();
  const pdfUrl = pdfLink.attr('href') ?? null;

  // Besøgsdato kan ligge i en separat tekst under rapporten
  const besoegsDatoTekst = $('*')
    .filter((_, el) => $(el).text().includes('tilsynsbesøget'))
    .first()
    .text();
  const besoegsDatoMatch = besoegsDatoTekst.match(/(\d{2}-\d{2}-\d{4})/);
  const besoegsDato = besoegsDatoMatch?.[1] ?? null;

  // Tags/chips – alle tekst-spans der ikke er knapindhold
  const tags: string[] = [];
  $('[class*="tag"], [class*="badge"], [class*="chip"], [class*="label"]').each((_, el) => {
    const tekst = $(el).text().trim();
    if (tekst && tekst.length < 60 && !tags.includes(tekst)) {
      tags.push(tekst);
    }
  });

  return {
    besoegsDato,
    tags,
    pdfUrl,
    sanktioner: udtraekSanktioner(tags),
    fokusOmraader: udtraekFokusOmraader(tags),
    kommune: udtraekKommune(tags),
    region: udtraekRegion(tags),
    tilsynsform: udtraekTilsynsform(tags),
    temaer: udtraekTemaer(tags),
  };
}

export async function scraperDetailSider(
  listeItems: StpsListeItem[],
  onFremskridt?: (behandlet: number, total: number) => void
): Promise<StpsDetailItem[]> {
  const resultater: StpsDetailItem[] = [];

  for (let i = 0; i < listeItems.length; i++) {
    const item = listeItems[i];

    try {
      const response = await axios.get<string>(item.detailUrl, STPS_HTTP_CONFIG);
      const detail = parseDetailSide(response.data);

      resultater.push({
        navn: item.navn,
        rapportDato: item.rapportDato,
        ...detail,
      });
    } catch {
      // Hvis én detailside fejler, fortsætter vi med de andre
      resultater.push({
        navn: item.navn,
        rapportDato: item.rapportDato,
        besoegsDato: null,
        tags: item.tags,
        pdfUrl: null,
        sanktioner: udtraekSanktioner(item.tags),
        fokusOmraader: udtraekFokusOmraader(item.tags),
        kommune: udtraekKommune(item.tags),
        region: udtraekRegion(item.tags),
        tilsynsform: udtraekTilsynsform(item.tags),
        temaer: udtraekTemaer(item.tags),
      });
    }

    onFremskridt?.(i + 1, listeItems.length);

    if (i < listeItems.length - 1) await venteMs(SCRAPER_DELAY_MS);
  }

  return resultater;
}
