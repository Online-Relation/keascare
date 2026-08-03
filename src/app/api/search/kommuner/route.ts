// src/app/api/search/kommuner/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { hentAlleKommuneNavne } from '@/features/kommuner/services/KommunerService';

export type KommuneSøgeresultat = {
  navn: string;
  slug: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  if (!q || q.length < 2) return NextResponse.json([]);

  const alle = await hentAlleKommuneNavne();

  const resultater: KommuneSøgeresultat[] = alle
    .filter((navn) => navn.toLowerCase().includes(q))
    .sort((a, b) => {
      // Exact match first, then startsWith, then contains
      const aStart = a.toLowerCase().startsWith(q) ? 0 : 1;
      const bStart = b.toLowerCase().startsWith(q) ? 0 : 1;
      return aStart - bStart || a.localeCompare(b, 'da');
    })
    .slice(0, 5)
    .map((navn) => ({ navn, slug: encodeURIComponent(navn) }));

  return NextResponse.json(resultater);
}
