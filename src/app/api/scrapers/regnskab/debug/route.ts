// Debug: test regnskab API med ét CVR og vis råsvar
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cvr = req.nextUrl.searchParams.get('cvr') ?? '36427404';
  const url = `https://regnskab.virk.dk/regnskab/xbrl/api/1/regnskab?cvrnummer=${cvr}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk' },
      cache: 'no-store',
    });

    const tekst = await res.text();
    let json: unknown = null;
    try { json = JSON.parse(tekst); } catch { /* ikke JSON */ }

    return NextResponse.json({
      cvr,
      url,
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get('content-type'),
      råsvar: json ?? tekst.slice(0, 500),
    });
  } catch (err) {
    return NextResponse.json({ cvr, url, fejl: String(err) }, { status: 500 });
  }
}
