// src/app/api/bosteder/kontakt/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const bostedId = request.nextUrl.searchParams.get('bostedId');
  if (!bostedId) return NextResponse.json({ error: 'Mangler bostedId' }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('bosted_kontakt_log')
    .select('*')
    .eq('bosted_id', bostedId)
    .order('oprettet_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const auth = await getAuthClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 });

  const body = await request.json() as { bostedId: string; status: string; note?: string };
  if (!body.bostedId || !body.status) {
    return NextResponse.json({ error: 'Mangler bostedId eller status' }, { status: 400 });
  }

  const brugerNavn = user.user_metadata?.navn ?? user.email ?? 'Ukendt';

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('bosted_kontakt_log')
    .insert({
      bosted_id: body.bostedId,
      bruger_id: user.id,
      bruger_navn: brugerNavn,
      status: body.status,
      note: body.note ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
