// src/app/api/scrapers/stps/debug-html/route.ts
// Returnerer rå pageHtml fra STPS GBAPI side 1 — bruges til at debugge parseren.

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as https from 'https';
import {
  STPS_LISTING_URL,
  STPS_HTTP_CONFIG,
} from '@/features/stps/constants/StpsConstants';

const MODULE_ID = 'gb_d3661996-7e72-4e6f-8f1a-d62c963c73a0';
const BOSTED_KATEGORISERING_ID = '44dc50a9-28b7-40fd-9bad-1b5e62aa712d';

function erAutoriseret(req: NextRequest): boolean {
  const secret = process.env.SCRAPER_SECRET;
  if (!secret) return true;
  return req.headers.get('x-scraper-secret') === secret;
}

export async function GET(request: NextRequest) {
  if (!erAutoriseret(request)) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const baseClient = axios.create({
    timeout: STPS_HTTP_CONFIG.timeout,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: {
      'User-Agent': STPS_HTTP_CONFIG.headers['User-Agent'],
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const pageResponse = await baseClient.get<string>(STPS_LISTING_URL, { responseType: 'text' });

  const cookieJar: Record<string, string> = {};
  const rawCookies = pageResponse.headers['set-cookie'] ?? [];
  for (const raw of rawCookies) {
    const [pair] = raw.split(';');
    const [name, value] = pair.split('=');
    if (name && value) cookieJar[name.trim()] = value.trim();
  }

  const html = pageResponse.data;
  const match = html.match(/data-config="([^"]+)"/);
  if (!match) return NextResponse.json({ error: 'Ingen data-config' }, { status: 500 });

  const config = JSON.parse(
    match[1].replace(/&quot;/g, '"').replace(/&#xA;/g, '\n').replace(/&amp;/g, '&')
  );

  const cookieString = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
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

  const svar = await client.post<{ pageHtml: string; totalResultCount: Record<string, number> }>(
    'https://stps.dk/gbapi/search/getPage',
    {
      config,
      page: 1,
      userInput: {
        query: '',
        months: [],
        categorizations: [BOSTED_KATEGORISERING_ID],
        additionalFilters: {},
        template: 'All',
        page: 1,
        moduleId: MODULE_ID,
      },
      lastGroupName: '',
      rootFolders: null,
    }
  );

  return NextResponse.json({
    totalResultCount: svar.data.totalResultCount,
    htmlLaengde: svar.data.pageHtml.length,
    // Første 8000 tegn af HTML så vi kan se strukturen
    htmlUddrag: svar.data.pageHtml.substring(0, 8000),
  });
}
