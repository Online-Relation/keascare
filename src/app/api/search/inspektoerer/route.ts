// src/app/api/search/inspektoerer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { hentAlleInspektoerer } from '@/features/stps/services/StpsInspektoerService';

export type InspektoerSøgeresultat = {
  slug: string;
  navn: string;
  titel: string | null;
  antal: number;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  if (!q || q.length < 2) return NextResponse.json([]);

  const alle = await hentAlleInspektoerer();

  const resultater: InspektoerSøgeresultat[] = alle
    .filter((i) =>
      i.navn.toLowerCase().includes(q) ||
      (i.titel ?? '').toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map((i) => ({ slug: i.slug, navn: i.navn, titel: i.titel, antal: i.antal }));

  return NextResponse.json(resultater);
}
