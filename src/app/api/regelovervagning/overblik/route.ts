import { NextResponse } from 'next/server';
import { hentOverblik } from '@/features/regelovervagning/services/RegulatoryItemService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const overblik = await hentOverblik();
    return NextResponse.json({ ok: true, overblik });
  } catch (err) {
    return NextResponse.json({ ok: false, fejl: String(err) }, { status: 500 });
  }
}
