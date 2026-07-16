import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? '';
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const urls = [
    'https://stps.dk/api/rss/nyheder',
    'https://stps.dk/da/nyheder',
    'https://stps.dk/da/nyheder?page=1',
  ];

  const resultater: Record<string, unknown> = {};

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 KeasCare-Monitor/1.0', Accept: 'text/html,application/xhtml+xml,application/xml' },
        cache: 'no-store',
        redirect: 'follow',
      });
      const tekst = await res.text();
      // Alle links med stps.dk i href
      const alleLinks = [...tekst.matchAll(/href="(https?:\/\/stps\.dk\/[^"]{10,150})"/g)]
        .map(m => m[1])
        .filter((v, i, a) => a.indexOf(v) === i) // unikke
        .slice(0, 40);

      resultater[url] = {
        status: res.status,
        contentType: res.headers.get('content-type'),
        længde: tekst.length,
        alleLinks,
        snippet50k: tekst.slice(50000, 51500), // sidst i HTML — nyheder er typisk nederst
      };
    } catch (err) {
      resultater[url] = { fejl: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json(resultater, { status: 200 });
}
