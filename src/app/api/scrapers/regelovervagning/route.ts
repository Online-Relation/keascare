import { NextRequest, NextResponse } from 'next/server';
import { kørRetsinformationImport } from '@/features/regelovervagning/services/RetsinformationService';
import { kørStpsNyhederImport } from '@/features/regelovervagning/services/StpsNyhederService';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret') ?? '';
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { kilder?: string[] };
  const kilder = body.kilder ?? ['retsinformation', 'stps'];

  const køRets = kilder.includes('retsinformation');
  const køStps = kilder.includes('stps');

  const [retsinformation, stpsNyheder] = await Promise.allSettled([
    køRets ? kørRetsinformationImport() : Promise.resolve(null),
    køStps ? kørStpsNyhederImport()     : Promise.resolve(null),
  ]);

  return NextResponse.json({
    ok: true,
    behandlet: 1,
    kørt: new Date().toISOString(),
    retsinformation: køRets ? (retsinformation.status === 'fulfilled' ? retsinformation.value : { fejl: String(retsinformation.reason) }) : 'sprunget over',
    stpsNyheder:     køStps ? (stpsNyheder.status === 'fulfilled'     ? stpsNyheder.value     : { fejl: String(stpsNyheder.reason) })     : 'sprunget over',
  });
}
