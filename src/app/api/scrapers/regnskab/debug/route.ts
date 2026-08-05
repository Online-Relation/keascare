// src/app/api/scrapers/regnskab/debug/route.ts
// Tester regnskab.virk.dk for ét CVR og returnerer råt svar — bruges til at debugge parseren.
// GET /api/scrapers/regnskab/debug?cvr=12345678

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as https from 'https';

const HTTP_CLIENT = axios.create({
  timeout: 15_000,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: { 'User-Agent': 'KeasCare/1.0 mads@onlinerelation.dk' },
});

export async function GET(req: NextRequest) {
  const cvr = req.nextUrl.searchParams.get('cvr');
  if (!cvr) return NextResponse.json({ error: 'Mangler ?cvr=12345678' }, { status: 400 });

  const url = `https://regnskab.virk.dk/regnskab/xbrl/api/1/regnskab?cvrnummer=${cvr}`;

  try {
    const res = await HTTP_CLIENT.get(url);
    const data = res.data;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ cvr, status: 200, besked: 'Tom liste — ingen regnskaber', raaData: data });
    }

    const seneste = [...data].sort((a: { regnskabsperiode?: { slutDato?: string }; indsendelsesDato?: string }, b: { regnskabsperiode?: { slutDato?: string }; indsendelsesDato?: string }) => {
      const da = a.regnskabsperiode?.slutDato ?? a.indsendelsesDato ?? '';
      const db = b.regnskabsperiode?.slutDato ?? b.indsendelsesDato ?? '';
      return db.localeCompare(da);
    })[0];

    return NextResponse.json({
      cvr,
      antalRegnskaber: data.length,
      senestePeriode: seneste?.regnskabsperiode,
      indsendt: seneste?.indsendelsesDato,
      xbrlUddrag: (seneste?.xbrlData ?? []).slice(0, 20),
      xbrlTotalFelter: (seneste?.xbrlData ?? []).length,
      senestNøgler: Object.keys(seneste ?? {}),
    });
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return NextResponse.json({ cvr, besked: 'Ingen regnskab fundet (404)' });
    }
    return NextResponse.json({ cvr, fejl: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
