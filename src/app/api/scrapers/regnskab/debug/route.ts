// Debug: undersøg regnskab-indeks struktur
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cvr = req.nextUrl.searchParams.get('cvr') ?? '36427404';
  const user = process.env.CVR_USER;
  const pass = process.env.CVR_PASS;

  if (!user || !pass) return NextResponse.json({ fejl: 'CVR_USER/CVR_PASS mangler' }, { status: 500 });

  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  const headers = { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` };

  const resultater: Record<string, unknown> = {};

  const tests: [string, string, object][] = [
    // Hent ét vilkårligt regnskab for at se strukturen
    ['regnskab_et_dokument', 'http://distribution.virk.dk/cvr-permanent/regnskab/_search', {
      query: { match_all: {} }, size: 1,
    }],
    // Novo Nordisk CVR
    ['novo_regnskab', 'http://distribution.virk.dk/cvr-permanent/regnskab/_search', {
      query: { term: { cvrNummer: 24256790 } }, size: 1,
    }],
    // Tjek indeks-mapping
    ['regnskab_mapping', 'http://distribution.virk.dk/cvr-permanent/regnskab/_mapping', null],
  ];

  for (const [navn, url, body] of tests) {
    try {
      const res = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: body ? headers : { Authorization: `Basic ${auth}` },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: 'no-store',
      });
      const tekst = await res.text();
      let json: unknown;
      try { json = JSON.parse(tekst); } catch { json = tekst.slice(0, 1000); }
      resultater[navn] = { status: res.status, svar: json };
    } catch (err) {
      resultater[navn] = { fejl: String(err) };
    }
  }

  return NextResponse.json({ cvr, resultater });
}
