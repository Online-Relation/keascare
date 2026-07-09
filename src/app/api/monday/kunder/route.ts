import { NextResponse } from 'next/server';
import { hentAlleMondayKunder } from '@/features/monday/services/MondayKunderService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const kunder = await hentAlleMondayKunder();
    return NextResponse.json({ ok: true, kunder });
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    return NextResponse.json({ ok: false, fejl: besked }, { status: 500 });
  }
}
