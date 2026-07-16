import { NextRequest, NextResponse } from 'next/server';

const GOPUBLIC_SEARCH_URL = 'https://cdn1.gopublic.dk/Assets/GoBasic/Applications/search/api/search';

const STPS_SEARCH_CONTEXT = {
  options: {
    specification: {
      siteSearch: false,
      pdfSearch: false,
      contextPath: '',
      filter: {
        t: ['NewsPage'],
        df: '01-01-2020',
        dt: '31-12-2030',
        cids: ['d96adbb4-54b8-4d61-9bd1-7783d2e3080f'],
        rf: ['e20d306a-c02d-4354-8c7b-8ca9995f9fbb'],
        r: true,
        ivr: true,
        exactMatch: false,
        sma: false,
        co: 'Or',
        cto: 'And',
        euco: 'Or',
      },
      options: {
        showTeaser: true,
        teaserTextLength: 160,
        showCategorizations: false,
        showDate: true,
        doNotShowInitialResults: false,
      },
    },
  },
};

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? '';
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  try {
    const res = await fetch(GOPUBLIC_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 KeasCare-Monitor/1.0',
        'Origin': 'https://stps.dk',
        'Referer': 'https://stps.dk/nyt-fra-styrelsen-for-patientsikkerhed',
      },
      body: JSON.stringify({
        context: Buffer.from(JSON.stringify(STPS_SEARCH_CONTEXT)).toString('base64'),
        query: '',
        page: 1,
        pageSize: 20,
        id: '0f88a17a-3b62-4a8d-aa3c-4180fd0784e5',
      }),
      cache: 'no-store',
    });

    const tekst = await res.text();
    return NextResponse.json({
      status: res.status,
      contentType: res.headers.get('content-type'),
      længde: tekst.length,
      snippet: tekst.slice(0, 3000),
    });
  } catch (err) {
    return NextResponse.json({ fejl: err instanceof Error ? err.message : String(err) });
  }
}
