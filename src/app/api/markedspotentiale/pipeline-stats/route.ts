import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('bosted_kontakt_log')
    .select('status');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tæl = (status: string) => (data ?? []).filter((r) => r.status === status).length;

  return NextResponse.json({
    kontaktet: tæl('Kontaktet'),
    afvist: tæl('Afvist'),
    kontaktSenere: tæl('Kontakt senere'),
    total: (data ?? []).length,
  });
}
