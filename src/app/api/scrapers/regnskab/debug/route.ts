// src/app/api/scrapers/regnskab/debug/route.ts
// Tester regnskab.virk.dk for ét CVR og returnerer råt svar — bruges til at debugge parseren.
// GET /api/scrapers/regnskab/debug?cvr=12345678

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cvr = req.nextUrl.searchParams.get('cvr');
  if (!cvr) return NextResponse.json({ error: 'Mangler ?cvr=12345678' }, { status: 400 });

  const url = `https://regnskab.virk.dk/regnskab/xbrl/api/1/regnskab?cvrnummer=${cvr}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk' },
      cache: 'no-store',
    });

    if (res.status === 404) return NextResponse.json({ cvr, status: 404, besked: 'Ingen regnskab fundet for dette CVR' });
    if (!res.ok) return NextResponse.json({ cvr, status: res.status, besked: `HTTP ${res.status}` });

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ cvr, status: 200, besked: 'Tom liste — ingen regnskaber', raaData: data });
    }

    // Vis seneste regnskab med fuld struktur
    const seneste = [...data].sort((a, b) => {
      const da = a.regnskabsperiode?.slutDato ?? a.indsendelsesDato ?? '';
      const db = b.regnskabsperiode?.slutDato ?? b.indsendelsesDato ?? '';
      return db.localeCompare(da);
    })[0];

    return NextResponse.json({
      cvr,
      antalRegnskaber: data.length,
      senestePeriode: seneste?.regnskabsperiode,
      indsendt: seneste?.indsendelsesDato,
      // Vis de første 20 XBRL-felter så vi kan se strukturen
      xbrlUddrag: (seneste?.xbrlData ?? []).slice(0, 20),
      xbrlTotalFelter: (seneste?.xbrlData ?? []).length,
      // Vis top-niveaunøgler i det seneste regnskab-objekt
      senestNøgler: Object.keys(seneste ?? {}),
    });
  } catch (err) {
    return NextResponse.json({ cvr, fejl: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
