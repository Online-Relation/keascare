// src/app/api/admin/rolle-rettigheder/route.ts

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('rolle_rettigheder')
    .select('rolle, stier')
    .order('rolle');

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rettigheder: data });
}

export async function POST(req: Request) {
  const { rolle, stier } = await req.json();
  if (!rolle || !Array.isArray(stier)) {
    return NextResponse.json({ ok: false, fejl: 'rolle og stier er påkrævet' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('rolle_rettigheder')
    .upsert({ rolle, stier, opdateret: new Date().toISOString() }, { onConflict: 'rolle' });

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
