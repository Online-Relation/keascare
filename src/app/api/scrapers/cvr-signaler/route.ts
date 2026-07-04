import { NextRequest, NextResponse } from 'next/server';
import { kørCvrSignalScraper } from '@/features/cvr/scraper/CvrSignalScraper/cvrSignalScraper';
import { logScraperKørsel } from '@/lib/db/ScraperLog';

export async function GET() {
  const cvrSat = !!(process.env.CVR_USER && process.env.CVR_PASS);
  return NextResponse.json({
    scraper: 'cvr-signaler',
    status:  cvrSat ? 'klar' : 'afventer-credentials',
    note:    cvrSat
      ? 'CVR_USER og CVR_PASS er sat — klar til kørsel'
      : 'Afventer CVR_USER + CVR_PASS fra distribution.virk.dk (Erhvervsstyrelsen)',
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret');
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { dage?: number };
  const dage = Math.min(Number(body.dage ?? 30), 90);

  try {
    const resultat = await kørCvrSignalScraper(dage);
    await logScraperKørsel('cvr-signaler', true, { ok: true, ...resultat });
    return NextResponse.json({ ok: true, ...resultat });
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    await logScraperKørsel('cvr-signaler', false, { error: besked });
    return NextResponse.json({ ok: false, fejl: besked }, { status: 500 });
  }
}
