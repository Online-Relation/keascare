// Debug: test regnskab via distribution.virk.dk
import { NextRequest, NextResponse } from 'next/server';
import { hentRegnskab } from '@/lib/api/RegnskabClient';

export async function GET(req: NextRequest) {
  const cvr = req.nextUrl.searchParams.get('cvr') ?? '36427404';

  try {
    const regnskab = await hentRegnskab(cvr);
    return NextResponse.json({ cvr, regnskab });
  } catch (err) {
    return NextResponse.json({ cvr, fejl: String(err) }, { status: 500 });
  }
}
