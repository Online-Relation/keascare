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

function parseNyheder(html: string, baseUrl: string): StpsNyhed[] {
  const nyheder: StpsNyhed[] = [];

  // STPS nyhedsliste — find artikel-links og titler
  const artikelRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
  let artikelMatch;

  while ((artikelMatch = artikelRegex.exec(html)) !== null) {
    const artikel = artikelMatch[1];

    const titleMatch = artikel.match(/<h[23][^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/i)
      ?? artikel.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/a>/i);

    if (!titleMatch) continue;

    const href = titleMatch[1].startsWith('http') ? titleMatch[1] : `https://stps.dk${titleMatch[1]}`;
    const title = titleMatch[2].trim();
    const externalId = href.replace(/https?:\/\/stps\.dk/, '').replace(/\//g, '-').slice(1, 80);

    const datoMatch = artikel.match(/(\d{1,2})[.\s]+(\w+)\s+(\d{4})/);
    const publishedAt = datoMatch ? parseDanskDato(datoMatch[0]) : null;

    const summaryMatch = artikel.match(/<p[^>]*>([\s\S]{20,400}?)<\/p>/);
    const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, '').trim() : null;

    const sourceType = bestemKildetype(href, title);

    nyheder.push({ externalId, title, publishedAt, summary, sourceUrl: href, sourceType });
  }

  // Fallback: søg efter nyhedslinks hvis ingen article-tags
  if (nyheder.length === 0) {
    const linkRegex = /<a[^>]+href="(\/da\/nyheder\/[^"]+)"[^>]*>([^<]{10,200})<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const href = `https://stps.dk${linkMatch[1]}`;
      const title = linkMatch[2].trim();
      const externalId = linkMatch[1].replace(/\//g, '-').slice(1, 80);
      nyheder.push({
        externalId,
        title,
        publishedAt: null,
        summary: null,
        sourceUrl: href,
        sourceType: 'nyhed',
      });
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
    const nyheder = parseNyheder(html, STPS_NYHEDER_URL);
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
