// src/app/api/scrapers/monday/match/route.ts

import { NextResponse } from 'next/server';
import { kørMondayMatch } from '@/features/monday/services/MondayMatchService';

export async function POST() {
  try {
    const resultat = await kørMondayMatch();

    return NextResponse.json({
      ok: true,
      hentetFraMonday: resultat.hentetFraMonday,
      matchetTilStps:  resultat.matchetTilStps,
      matchetTilTp:    resultat.matchetTilTp,
      ingenMatch:      resultat.ingenMatch,
      ukendte:         resultat.ukendte.map((u) => ({
        navn:      u.navn,
        gruppe:    u.gruppeNavn,
        mondayId:  u.mondayId,
      })),
    });
  } catch (err) {
    const besked = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, fejl: besked }, { status: 500 });
  }
}
