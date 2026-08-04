// src/app/api/markedsdata/ai-analyse/route.ts
// Bruges af refresh-knappen i UI — kræver aktiv Supabase-session

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { genererAiAnalyse } from '@/features/markedsdata/services/AiAnalyseService';
import { hentDstFraCache, hentDstÅrligeData } from '@/lib/api/DstClient';
import type { BrugerRolle } from '@/features/auth/config/roller.config';

export const maxDuration = 120;

const TILLADTE_ROLLER: BrugerRolle[] = ['development', 'direktør'];

export async function POST() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 });
  }

  const rolle = user.user_metadata?.rolle as BrugerRolle | undefined;
  if (!rolle || !TILLADTE_ROLLER.includes(rolle)) {
    return NextResponse.json({ error: 'Ingen adgang' }, { status: 403 });
  }

  try {
    const [cache, dstTrend] = await Promise.all([
      hentDstFraCache(),
      hentDstÅrligeData(2016).catch(() => []),
    ]);

    await genererAiAnalyse(cache.data, dstTrend);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    return NextResponse.json({ ok: false, error: besked }, { status: 500 });
  }
}
