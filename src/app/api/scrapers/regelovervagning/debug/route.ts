import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? '';
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  try {
    const res = await fetch('https://stps.dk/nyt-fra-styrelsen-for-patientsikkerhed', {
      headers: { 'User-Agent': 'Mozilla/5.0 KeasCare-Monitor/1.0' },
      cache: 'no-store',
    });
    const html = await res.text();

    // Find apiUrl og andre relevante parametre i HTML
    const apiUrlMatch = html.match(/["\']?apiUrl["\']?\s*[:=]\s*["\']([^"\']+)["\']/) ??
                        html.match(/api[_-]?url["\']?\s*[:=]\s*["\']([^"\']+)["\']/) ??
                        html.match(/gopublic[^"\']{0,200}search[^"\']{0,100}/i);

    // Find alle gopublic CDN URL'er
    const gopublicUrls = [...html.matchAll(/https:\/\/[^"'\s]{0,100}gopublic[^"'\s]{0,100}/gi)]
      .map(m => m[0])
      .filter((v, i, a) => a.indexOf(v) === i);

    // Find data-attributter der indeholder søge-config
    const dataAttrs = [...html.matchAll(/data-[a-z-]+="[^"]{20,500}"/gi)]
      .map(m => m[0].slice(0, 200))
      .slice(0, 10);

    // Kig efter fetch/ajax kald i HTML
    const fetchUrls = [...html.matchAll(/fetch\s*\(\s*['"](https?:\/\/[^'"]+)['"]/gi)]
      .map(m => m[1])
      .slice(0, 10);

    // Søg specifikt efter søge-API i scripts
    const searchApiMatch = html.match(/(https?:\/\/[^"'\s]+\/search[^"'\s]*)/gi)?.slice(0, 10);

    return NextResponse.json({
      status: res.status,
      htmlLængde: html.length,
      apiUrlMatch: apiUrlMatch?.[0] ?? null,
      gopublicUrls: gopublicUrls.slice(0, 15),
      dataAttrs,
      fetchUrls,
      searchApiMatch,
      snippet70k: html.slice(70000, 72000),
    });
  } catch (err) {
    return NextResponse.json({ fejl: err instanceof Error ? err.message : String(err) });
  }
}
