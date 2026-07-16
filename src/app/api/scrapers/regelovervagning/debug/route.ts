import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? '';
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const res = await fetch('https://stps.dk/sitemap.xml', {
    headers: { 'User-Agent': 'Mozilla/5.0 KeasCare-Monitor/1.0' },
    cache: 'no-store',
  });
  const xml = await res.text();

  // Udtræk alle URL + lastmod par
  const urls = [...xml.matchAll(/<loc>(https:\/\/stps\.dk\/[^<]+)<\/loc>\s*(?:<lastmod>([^<]+)<\/lastmod>)?/g)]
    .map(m => ({ url: m[1], lastmod: m[2] ?? null }));

  // Filtrer nyheds-lignende URL'er
  const nyheder = urls.filter(u =>
    u.url.includes('nyheder') ||
    u.url.includes('nyt-fra') ||
    u.url.includes('obs-meddelelse') ||
    u.url.includes('udgivelse') ||
    u.url.includes('klog-paa') ||
    u.url.includes('paabud')
  ).slice(0, 30);

  return NextResponse.json({
    totalUrls: urls.length,
    nyhedsUrls: nyheder.length,
    eksempler: nyheder.slice(0, 20),
    alleNyhederPrefix: urls.filter(u => u.url.match(/stps\.dk\/[^/]+\/20\d\d\//)).slice(0, 10),
  });
}
