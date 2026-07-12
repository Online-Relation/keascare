// Debug: undersøg hvad CVR distribution API faktisk indeholder af regnskabsdata
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cvr = req.nextUrl.searchParams.get('cvr') ?? '28897642';
  const user = process.env.CVR_USER;
  const pass = process.env.CVR_PASS;

  if (!user || !pass) return NextResponse.json({ fejl: 'CVR_USER/CVR_PASS mangler' }, { status: 500 });

  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  const authHeader = { Authorization: `Basic ${auth}` };
  const jsonHeaders = { ...authHeader, 'Content-Type': 'application/json' };

  const resultater: Record<string, unknown> = {};

  // 1. Hent ALLE felter fra virksomheds-dokumentet for dette CVR
  try {
    const res = await fetch('http://distribution.virk.dk/cvr-permanent/virksomhed/_search', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        query: { term: { 'Vrvirksomhed.cvrNummer': parseInt(cvr, 10) } },
        size: 1,
      }),
      cache: 'no-store',
    });
    const json = await res.json();
    resultater['virksomhed_alle_felter'] = json?.hits?.hits?.[0]?._source ?? null;
  } catch (err) { resultater['virksomhed_alle_felter'] = { fejl: String(err) }; }

  // 2. Liste alle indekser i distribution.virk.dk
  try {
    const res = await fetch('http://distribution.virk.dk/_cat/indices?format=json', {
      headers: authHeader, cache: 'no-store',
    });
    resultater['alle_indekser'] = await res.json();
  } catch (err) { resultater['alle_indekser'] = { fejl: String(err) }; }

  return NextResponse.json({ cvr, resultater });
}
