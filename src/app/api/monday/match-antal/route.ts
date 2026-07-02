import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { count, error } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .not('monday_item_id', 'is', null);

  if (error) return NextResponse.json({ antal: 0 }, { status: 500 });
  return NextResponse.json({ antal: count ?? 0 });
}
