// POST /api/scrapers/stps/repair-geo
// Besøger detailsider for rækker der mangler region eller tilsynsform
// og opdaterer dem direkte fra detail-HTML.

import { NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio';
import * as https from 'https';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import {
  udtraekKommune,
  udtraekRegion,
  udtraekTilsynsform,
} from '@/features/stps/mappers/StpsFundMapper';
import { validerScraperSecret } from '@/lib/api/ScraperAuth/scraperAuth';

const DELAY_MS = 600;

function venteMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function udtraekTagsFraHtml(html: string): string[] {
  const $ = load(html);
  const tags: string[] = [];

  $(
    [
      '.labels .label',
      '.tags .tag',
      '[class*="label"]',
      '[class*="tag"]',
      '[class*="badge"]',
      '[class*="chip"]',
      'tags tag',
      'tags > *',
      'labels label',
      'labels > *',
    ].join(', ')
  ).each((_, el) => {
    const tekst = $(el).text().trim();
    if (tekst && tekst.length < 60 && !tags.includes(tekst)) tags.push(tekst);
  });

  return tags;
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function POST(req: Request) {
  const authFejl = validerScraperSecret(req);
  if (authFejl) return authFejl;

  const body = await req.json().catch(() => ({}));
  const batch = Math.min(Number(body.batch) || 20, 50);

  const supabase = getSupabaseServerClient();

  // Hent rækker med rapport_url men manglende region eller tilsynsform
  const { data: rækker, error } = await supabase
    .from('stps_rapporter')
    .select('id, rapport_url, stps_tilbud_navn, region, tilsynsform, kommune')
    .not('rapport_url', 'is', null)
    .not('rapport_url', 'like', 'stps://genereret/%')
    .or('region.is.null,tilsynsform.is.null')
    .order('rapport_dato', { ascending: false })
    .limit(batch);

  if (error) {
    return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  }

  if (!rækker || rækker.length === 0) {
    return NextResponse.json({ ok: true, besked: 'Ingen rækker at reparere', behandlet: 0 });
  }

  let opdateret = 0;
  let ingenTags = 0;
  let fejl = 0;

  for (let i = 0; i < rækker.length; i++) {
    const { id, rapport_url, stps_tilbud_navn } = rækker[i];

    try {
      const res = await axios.get<string>(rapport_url!, {
        headers: {
          'User-Agent': 'KeasCare-Scraper/1.0 (keascare.dk – kontakt: mads@onlinerelation.dk)',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: 12_000,
        responseType: 'text',
        httpsAgent,
        validateStatus: (s) => s < 500,
      });

      if (res.status !== 200) {
        console.warn(`[repair-geo] ${stps_tilbud_navn}: HTTP ${res.status}`);
        fejl++;
        continue;
      }

      const tags = udtraekTagsFraHtml(res.data);
      const region = udtraekRegion(tags);
      const tilsynsform = udtraekTilsynsform(tags);
      const kommune = udtraekKommune(tags);

      if (!region && !tilsynsform && !kommune) {
        ingenTags++;
        continue;
      }

      const opdatering: Record<string, string | null> = {};
      if (region)      opdatering.region      = region;
      if (tilsynsform) opdatering.tilsynsform  = tilsynsform;
      if (kommune)     opdatering.kommune      = kommune;

      const { error: updErr } = await supabase
        .from('stps_rapporter')
        .update(opdatering)
        .eq('id', id);

      if (updErr) {
        console.error(`[repair-geo] Update fejl for ${id}:`, updErr.message);
        fejl++;
      } else {
        opdateret++;
        console.log(`[repair-geo] ✓ ${stps_tilbud_navn}: region="${region}" tilsyn="${tilsynsform}"`);
      }
    } catch (err) {
      console.error(`[repair-geo] Fejl for ${stps_tilbud_navn}:`, err instanceof Error ? err.message : String(err));
      fejl++;
    }

    if (i < rækker.length - 1) await venteMs(DELAY_MS);
  }

  return NextResponse.json({
    ok: true,
    behandlet: rækker.length,
    opdateret,
    ingenTags,
    fejl,
  });
}
