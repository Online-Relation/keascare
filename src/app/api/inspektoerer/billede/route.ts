// src/app/api/inspektoerer/billede/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ url: null });

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('inspektoer_billeder')
    .select('billede_url')
    .eq('slug', slug)
    .maybeSingle();

  return NextResponse.json({ url: data?.billede_url ?? null });
}
