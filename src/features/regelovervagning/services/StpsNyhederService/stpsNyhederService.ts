// src/features/regelovervagning/services/StpsNyhederService/stpsNyhederService.ts
// Henter påbud og OBS-meddelelser fra stps.dk via sitemap.xml

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { vurderRelevans } from '@/features/regelovervagning/services/RelevansService';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

const STPS_SITEMAP_URL = 'https://stps.dk/sitemap.xml';
const DAGE_TILBAGE = 90;

// Ord i titlen der indikerer at påbuddet IKKE er rettet mod et botilbud.
// Inkluderer både dansk (æøå) og URL-ASCII-form (ae/oe/aa) da titler stammer fra URL-slugs.
const EKSKLUDER_ORD = [
  // Tandlæger
  'tandlæge', 'tandlægerne', 'tandklinik', 'tandlægehuset',
  'tandlaege', 'tandlaegerne', 'tandklinik', 'tandlaegehuset',
  // Hjemmepleje / sygepleje
  'hjemmepleje', 'hjemmeplejen', 'hjemmeplejeenhed',
  'hjemmesygepleje', 'hjemmesygeplejen',
  'sygeplejeklinik', 'sygeplejestation',
  // Plejehjem
  'plejehjem', 'plejecenter', 'plejehjemmet', 'plejebolig',
  // Apotek
  'apotek', 'apoteket',
  // Sygehus / hospital
  'sygehus', 'hospital', 'hospitalet',
  // Borger-teams (kommunale enheder, ikke botilbud)
  'borgerteam', 'borgerservice',
  // Lægepraksis
  'lægepraksis', 'laegepraksis', 'lægehus', 'laegehus', 'lægeklinik', 'laegeklinik',
  // Akut
  'akutteam', 'akutfunktion',
];

type StpsItem = {
  externalId: string;
  title: string;
  publishedAt: string | null;
  summary: string | null;
  sourceUrl: string;
  sourceType: string;
};

function sitemapUrlTilItem(url: string, lastmod: string | null): StpsItem | null {
  const erPaabud = url.includes('/paabud-til-behandlingssteder/paabud/') &&
    url.match(/\/paabud\/\d{4}\/\w+\/[^/]+$/);
  const erObs = url.includes('/obs-meddelelser/') &&
    url.match(/\/obs-meddelelser\/\d{4}\/\w+\/[^/]+$/);
  const erNyhed = url.includes('/nyt-fra-styrelsen') &&
    url.match(/\/\d{4}\/\w+\/[^/]+$/);

  if (!erPaabud && !erObs && !erNyhed) return null;

  const slug = url.split('/').pop() ?? '';
  const titel = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const sourceType = erPaabud ? 'påbud' : erObs ? 'obs-meddelelse' : 'nyhed';

  const externalId = url
    .replace('https://stps.dk', '')
    .replace(/\//g, '-')
    .slice(1, 80);

  return {
    externalId,
    title: erPaabud ? `Påbud: ${titel}` : erObs ? `OBS: ${titel}` : titel,
    publishedAt: lastmod ? lastmod.slice(0, 10) : null,
    summary: null,
    sourceUrl: url,
    sourceType,
  };
}

function erNy(lastmod: string | null): boolean {
  if (!lastmod) return false;
  const grænse = new Date();
  grænse.setDate(grænse.getDate() - DAGE_TILBAGE);
  return new Date(lastmod) >= grænse;
}

async function rydIrrelevante(supabase: ReturnType<typeof getSupabaseServerClient>): Promise<number> {
  const { data } = await supabase
    .from('regulatory_items')
    .select('id, title')
    .eq('source', 'stps');

  if (!data) return 0;

  const sletIds = data
    .filter((item) => {
      const norm = item.title.toLowerCase();
      return EKSKLUDER_ORD.some((ord) => norm.includes(ord));
    })
    .map((item) => item.id);

  if (sletIds.length === 0) return 0;

  await supabase.from('regulatory_items').delete().in('id', sletIds);
  return sletIds.length;
}

export async function kørStpsNyhederImport(): Promise<{ hentet: number; gemt: number; slettet: number; fejl: number }> {
  const supabase = getSupabaseServerClient();
  let hentet = 0;
  let gemt = 0;
  let slettet = 0;
  let fejl = 0;

  try {
    const res = await fetch(STPS_SITEMAP_URL, {
      headers: { 'User-Agent': 'KeasCare-Monitor/1.0', Accept: 'application/xml, text/xml' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Sitemap HTTP ${res.status}`);

    const xml = await res.text();
    const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/g)]
      .map(m => ({ url: m[1].trim(), lastmod: m[2]?.trim() ?? null }));

    const relevante = entries
      .filter(e => erNy(e.lastmod))
      .map(e => sitemapUrlTilItem(e.url, e.lastmod))
      .filter((i): i is StpsItem => i !== null);

    console.log('[STPS-nyheder] Sitemap:', entries.length, 'URLs,', relevante.length, 'nye relevante');
    hentet = relevante.length;

    for (const item of relevante) {
      const titelNorm = item.title.toLowerCase();
      if (EKSKLUDER_ORD.some((ord) => titelNorm.includes(ord))) continue;

      const tekst = item.title;
      const { score, level, topics, recommendedAction } = vurderRelevans(tekst);

      const nytItem = {
        source: 'stps' as const,
        external_id: item.externalId,
        source_type: item.sourceType,
        title: item.title,
        summary: item.summary,
        source_url: item.sourceUrl,
        published_at: item.publishedAt,
        last_seen_at: new Date().toISOString(),
        relevance_score: score,
        relevance_level: level,
        topics,
        recommended_action: recommendedAction,
        raw_payload: item as unknown as Record<string, unknown>,
      };

      const { data: eksisterende } = await supabase
        .from('regulatory_items')
        .select('id')
        .eq('source', 'stps')
        .eq('external_id', item.externalId)
        .single();

      if (eksisterende) {
        await supabase
          .from('regulatory_items')
          .update({ last_seen_at: new Date().toISOString() })
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
    console.error('[STPS-nyheder]', besked);
    await logScraperKørsel('stps-nyheder', false, { error: besked });
    return { hentet, gemt, slettet, fejl: 1 };
  }

  slettet = await rydIrrelevante(supabase);
  console.log('[STPS-nyheder] Slettet', slettet, 'irrelevante items');

  await logScraperKørsel('stps-nyheder', true, { hentet, gemt, slettet, fejl });
  return { hentet, gemt, slettet, fejl };
}
