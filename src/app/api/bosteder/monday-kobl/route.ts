// src/app/api/bosteder/monday-kobl/route.ts
// Manuel kobling af et STPS-bosted til en Monday-kunde.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

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

  const { error } = await supabase
    .from('stps_rapporter')
    .update({
      monday_item_id:    mondayItemId,
      monday_gruppe:     mondayGruppe ?? null,
      monday_match_dato: new Date().toISOString(),
    })
    .eq('id', bostedId);

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
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
