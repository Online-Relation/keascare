// Debug: test regnskab API alternativer
import { NextRequest, NextResponse } from 'next/server';

async function testUrl(url: string, headers?: Record<string, string>) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'KeasCare/1.0', ...headers }, cache: 'no-store' });
    const tekst = await res.text();
    let json: unknown = null;
    try { json = JSON.parse(tekst); } catch { /* ikke JSON */ }
    return { url, status: res.status, ok: res.ok, svar: json ?? tekst.slice(0, 300) };
  } catch (err) {
    return { url, fejl: String(err) };
  }
}

export async function GET(req: NextRequest) {
  const cvr = req.nextUrl.searchParams.get('cvr') ?? '36427404';

  const resultater = await Promise.all([
    testUrl(`https://cvrapi.dk/api?search=${cvr}&country=dk`),
    testUrl(`https://cvrapi.dk/api?search=10001987&country=dk`), // Novo Nordisk — stort CVR der altid findes
  ]);

  return NextResponse.json({ cvr, resultater });
}
