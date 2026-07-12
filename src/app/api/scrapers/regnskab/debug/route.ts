// Debug: test regnskab via distribution.virk.dk
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cvr = req.nextUrl.searchParams.get('cvr') ?? '36427404';
  const user = process.env.CVR_USER;
  const pass = process.env.CVR_PASS;

  if (!user || !pass) return NextResponse.json({ fejl: 'CVR_USER/CVR_PASS mangler' }, { status: 500 });

  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  const headers = { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` };

  // Test 1: simpel query uden sort
  const body1 = {
    query: { term: { cvrNummer: parseInt(cvr, 10) } },
    size: 1,
  };

  // Test 2: match query
  const body2 = {
    query: { match: { cvrNummer: cvr } },
    size: 1,
  };

  const resultater: Record<string, unknown> = {};

  for (const [navn, url, body] of [
    ['regnskab_term', 'http://distribution.virk.dk/cvr-permanent/regnskab/_search', body1],
    ['regnskab_match', 'http://distribution.virk.dk/cvr-permanent/regnskab/_search', body2],
    ['virksomhed_regnskab', 'http://distribution.virk.dk/cvr-permanent/virksomhed/_search', {
      _source: ['Vrvirksomhed.cvrNummer', 'Vrvirksomhed.virksomhedMetadata.nyesteRegnskab'],
      query: { term: { 'Vrvirksomhed.cvrNummer': parseInt(cvr, 10) } },
      size: 1,
    }],
  ] as [string, string, object][]) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store' });
      const tekst = await res.text();
      let json: unknown;
      try { json = JSON.parse(tekst); } catch { json = tekst.slice(0, 500); }
      resultater[navn] = { status: res.status, svar: json };
    } catch (err) {
      resultater[navn] = { fejl: String(err) };
    }
  }

  return NextResponse.json({ cvr, resultater });
}
