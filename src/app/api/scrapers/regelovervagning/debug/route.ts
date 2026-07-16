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
      // Find alle links der ligner nyhedslinks
      const links = [...tekst.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([^<]{5,150})<\/a>/g)]
        .map(m => ({ href: m[1], tekst: m[2].trim() }))
        .filter(l => l.href.includes('nyheder') || l.href.includes('obs') || l.href.includes('udgivelse'))
        .slice(0, 20);

      resultater[url] = {
        status: res.status,
        contentType: res.headers.get('content-type'),
        længde: tekst.length,
        links,
        snippet: tekst.slice(20000, 21000), // midt i HTML — der er typisk nyheder
      };
    } catch (err) {
      resultater[url] = { fejl: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json(resultater, { status: 200 });
}
