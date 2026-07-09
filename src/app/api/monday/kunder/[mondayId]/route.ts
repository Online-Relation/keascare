// Henter én Monday-kunde fra Supabase-cachen.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ mondayId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { mondayId } = await params;
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('monday_kunder')
    .select('*')
    .eq('monday_id', mondayId)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, fejl: 'Ikke fundet' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, kunde: data });
}
