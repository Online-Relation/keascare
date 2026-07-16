// src/features/regelovervagning/services/StpsNyhederService/stpsNyhederService.ts
// Henter nyheder fra Styrelsen for Patientsikkerheds nyhedsarkiv.
// Adskilt fra STPS tilsynsrapport-importen.

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { vurderRelevans } from '@/features/regelovervagning/services/RelevansService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

const STPS_NYHEDER_URL = 'https://stps.dk/da/nyheder';

type StpsNyhed = {
  externalId: string;
  title: string;
  publishedAt: string | null;
  summary: string | null;
  sourceUrl: string;
  sourceType: string;
};

function parseNyheder(html: string): StpsNyhed[] {
  const nyheder: StpsNyhed[] = [];
  const set = new Set<string>();

  // Strategi 1: <article>-tags
  const artikelRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
  let m: RegExpExecArray | null;
  while ((m = artikelRegex.exec(html)) !== null) {
    const blok = m[1];
    const linkM = blok.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]{5,200}?)<\/a>/i);
    if (!linkM) continue;
    const href = linkM[1].startsWith('http') ? linkM[1] : `https://stps.dk${linkM[1]}`;
    const title = linkM[2].replace(/<[^>]+>/g, '').trim();
    if (!title || set.has(href)) continue;
    set.add(href);
    const externalId = href.replace(/https?:\/\/stps\.dk/, '').replace(/\W+/g, '-').slice(0, 80);
    const datoM = blok.match(/(\d{1,2})[.]\s*(\w+)\s+(\d{4})/);
    const summaryM = blok.match(/<p[^>]*>([\s\S]{20,400}?)<\/p>/);
    nyheder.push({
      externalId,
      title,
      publishedAt: datoM ? parseDanskDato(datoM[0]) : null,
      summary: summaryM ? summaryM[1].replace(/<[^>]+>/g, '').trim() : null,
      sourceUrl: href,
      sourceType: bestemKildetype(href, title),
    });
  }

  // Strategi 2: li/div-blokke med nyhedslinks
  if (nyheder.length === 0) {
    const blokRegex = /<(?:li|div)[^>]*>([\s\S]{30,1000}?)<\/(?:li|div)>/gi;
    while ((m = blokRegex.exec(html)) !== null) {
      const blok = m[1];
      const linkM = blok.match(/<a[^>]+href="(\/da\/(?:nyheder|udgivelser|obs-meddelelser)[^"]+)"[^>]*>([\s\S]{5,200}?)<\/a>/i);
      if (!linkM) continue;
      const href = `https://stps.dk${linkM[1]}`;
      const title = linkM[2].replace(/<[^>]+>/g, '').trim();
      if (!title || title.length < 5 || set.has(href)) continue;
      set.add(href);
      const externalId = linkM[1].replace(/\W+/g, '-').slice(0, 80);
      const datoM = blok.match(/(\d{1,2})[.]\s*(\w+)\s+(\d{4})/);
      const summaryM = blok.match(/<p[^>]*>([\s\S]{20,400}?)<\/p>/);
      nyheder.push({
        externalId,
        title,
        publishedAt: datoM ? parseDanskDato(datoM[0]) : null,
        summary: summaryM ? summaryM[1].replace(/<[^>]+>/g, '').trim() : null,
        sourceUrl: href,
        sourceType: bestemKildetype(href, title),
      });
    }
  }

  // Strategi 3: bare links med nyhedssti
  if (nyheder.length === 0) {
    const linkRegex = /<a[^>]+href="(\/da\/(?:nyheder|udgivelser|obs-meddelelser)\/\d[^"]+)"[^>]*>([^<]{10,200})<\/a>/gi;
    while ((m = linkRegex.exec(html)) !== null) {
      const href = `https://stps.dk${m[1]}`;
      const title = m[2].trim();
      if (!title || set.has(href)) continue;
      set.add(href);
      const externalId = m[1].replace(/\W+/g, '-').slice(0, 80);
      nyheder.push({ externalId, title, publishedAt: null, summary: null, sourceUrl: href, sourceType: bestemKildetype(href, title) });
    }
  }

  return nyheder;
}

function parseDanskDato(tekst: string): string | null {
  const måneder: Record<string, string> = {
    januar: '01', februar: '02', marts: '03', april: '04', maj: '05', juni: '06',
    juli: '07', august: '08', september: '09', oktober: '10', november: '11', december: '12',
  };
  const m = tekst.match(/(\d{1,2})[.\s]+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const mnd = måneder[m[2].toLowerCase()];
  if (!mnd) return null;
  return `${m[3]}-${mnd}-${m[1].padStart(2, '0')}`;
}

function bestemKildetype(url: string, title: string): string {
  const norm = (url + ' ' + title).toLowerCase();
  if (norm.includes('obs-meddelelse')) return 'obs-meddelelse';
  if (norm.includes('påbud')) return 'påbud';
  if (norm.includes('klog-paa-uth') || norm.includes('klog på uth')) return 'klog-paa-uth';
  if (norm.includes('udgivelse')) return 'udgivelse';
  return 'nyhed';
}

export async function kørStpsNyhederImport(): Promise<{ hentet: number; gemt: number; fejl: number }> {
  const supabase = getSupabaseServerClient();
  let hentet = 0;
  let gemt = 0;
  let fejl = 0;

  try {
    const res = await fetch(STPS_NYHEDER_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 KeasCare-Monitor/1.0', Accept: 'text/html' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    console.log('[STPS-nyheder] HTML længde:', html.length, 'bytes');
    const nyheder = parseNyheder(html);
    hentet = nyheder.length;

    for (const nyhed of nyheder) {
      const tekst = [nyhed.title, nyhed.summary ?? ''].join(' ');
      const { score, level, topics, recommendedAction } = vurderRelevans(tekst);

      const nytItem = {
        source: 'stps' as const,
        external_id: nyhed.externalId,
        source_type: nyhed.sourceType,
        title: nyhed.title,
        summary: nyhed.summary,
        source_url: nyhed.sourceUrl,
        published_at: nyhed.publishedAt,
        last_seen_at: new Date().toISOString(),
        relevance_score: score,
        relevance_level: level,
        topics,
        recommended_action: recommendedAction,
        raw_payload: nyhed as unknown as Record<string, unknown>,
      };

      const { data: eksisterende } = await supabase
        .from('regulatory_items')
        .select('id')
        .eq('source', 'stps')
        .eq('external_id', nyhed.externalId)
        .single();

      if (eksisterende) {
        await supabase
          .from('regulatory_items')
          .update({ last_seen_at: new Date().toISOString(), relevance_score: score })
          .eq('id', eksisterende.id);
      } else {
        await supabase.from('regulatory_items').insert({
          ...nytItem,
          first_seen_at: new Date().toISOString(),
        });
        gemt++;
      }
    }
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    await logScraperKørsel('stps-nyheder', false, { error: besked });
    return { hentet, gemt, fejl: 1 };
  }

  await logScraperKørsel('stps-nyheder', true, { hentet, gemt, fejl });
  return { hentet, gemt, fejl };
}
