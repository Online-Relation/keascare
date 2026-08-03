// src/app/api/search/kommuner/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type KommuneSøgeresultat = {
  navn: string;
  slug: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const supabase = getSupabaseServerClient();

  const [{ data: d1 }, { data: d2 }] = await Promise.all([
    supabase.from('stps_rapporter').select('kommune').ilike('kommune', `%${q}%`).not('kommune', 'is', null).limit(50),
    supabase.from('stps_rapporter').select('tp_kommune').ilike('tp_kommune', `%${q}%`).not('tp_kommune', 'is', null).limit(50),
  ]);

  const unikke = new Set<string>();
  for (const r of (d1 ?? []) as { kommune: string }[]) unikke.add(r.kommune.trim());
  for (const r of (d2 ?? []) as { tp_kommune: string }[]) unikke.add(r.tp_kommune.trim());

  const q_lower = q.toLowerCase();
  const resultater: KommuneSøgeresultat[] = [...unikke]
    .filter((navn) => navn.length > 1)
    .sort((a, b) => {
      const aStart = a.toLowerCase().startsWith(q_lower) ? 0 : 1;
      const bStart = b.toLowerCase().startsWith(q_lower) ? 0 : 1;
      return aStart - bStart || a.localeCompare(b, 'da');
    })
    .slice(0, 5)
    .map((navn) => ({ navn, slug: encodeURIComponent(navn) }));

  return NextResponse.json(resultater);
}
