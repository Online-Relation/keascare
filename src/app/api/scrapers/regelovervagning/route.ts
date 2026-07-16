import { NextRequest, NextResponse } from 'next/server';
import { kørRetsinformationImport } from '@/features/regelovervagning/services/RetsinformationService';
import { kørStpsNyhederImport } from '@/features/regelovervagning/services/StpsNyhederService';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret') ?? '';
  if (secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ error: 'Uautoriseret' }, { status: 401 });
  }

  const [retsinformation, stpsNyheder] = await Promise.allSettled([
    kørRetsinformationImport(),
    kørStpsNyhederImport(),
  ]);

  return NextResponse.json({
    ok: true,
    kørt: new Date().toISOString(),
    retsinformation: retsinformation.status === 'fulfilled' ? retsinformation.value : { fejl: String(retsinformation.reason) },
    stpsNyheder:     stpsNyheder.status === 'fulfilled'     ? stpsNyheder.value     : { fejl: String(stpsNyheder.reason) },
  });
}
