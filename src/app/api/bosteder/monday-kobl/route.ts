// src/app/api/bosteder/monday-kobl/route.ts
// Manuel kobling af et STPS-bosted til en Monday-kunde.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

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

export async function POST(request: NextRequest) {
  const { bostedId, mondayItemId, mondayGruppe } = await request.json() as {
    bostedId: string;
    mondayItemId: string;
    mondayGruppe: string;
  };

  if (!bostedId || !mondayItemId) {
    return NextResponse.json({ ok: false, fejl: 'bostedId og mondayItemId er påkrævet' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // Hent bosted-navn til aktivitetsloggen
  const { data: bosted } = await supabase
    .from('stps_rapporter')
    .select('stps_tilbud_navn')
    .eq('id', bostedId)
    .maybeSingle();

  const { error } = await supabase
    .from('stps_rapporter')
    .update({
      monday_item_id:    mondayItemId,
      monday_gruppe:     mondayGruppe ?? null,
      monday_match_dato: new Date().toISOString(),
    })
    .eq('id', bostedId);

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });

  // Log konverteringen med bruger-attribution til Nova-beskeder
  const auth = await getAuthClient();
  const { data: { user } } = await auth.auth.getUser();

  if (user) {
    await supabase.from('bosted_kontakt_log').insert({
      bosted_id:   bostedId,
      bosted_navn: bosted?.stps_tilbud_navn ?? null,
      bruger_id:   user.id,
      bruger_navn: user.user_metadata?.navn ?? user.email ?? 'Ukendt',
      status:      'kobling_oprettet',
      note:        `Koblet til Monday item ${mondayItemId}`,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { bostedId } = await request.json() as { bostedId: string };

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('stps_rapporter')
    .update({ monday_item_id: null, monday_gruppe: null, monday_match_dato: null })
    .eq('id', bostedId);

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
