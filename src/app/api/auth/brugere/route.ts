import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request) {
  const { email, kodeord, navn, rolle } = await req.json();

  if (!email || !kodeord) {
    return NextResponse.json({ ok: false, fejl: 'E-mail og kodeord er påkrævet.' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: kodeord,
    email_confirm: true,
    user_metadata: { navn: navn ?? '', rolle: rolle ?? null },
  });

  if (error) {
    return NextResponse.json({ ok: false, fejl: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, bruger: { id: data.user.id, email: data.user.email } });
}

export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });
  }

  const brugere = data.users.map((u) => ({
    id:             u.id,
    email:          u.email,
    navn:           u.user_metadata?.navn ?? '',
    rolle:          u.user_metadata?.rolle ?? null,
    oprettet:       u.created_at,
    sidstLoggetInd: u.last_sign_in_at ?? null,
  }));

  return NextResponse.json({ ok: true, brugere });
}

export async function PATCH(req: Request) {
  const { id, rolle } = await req.json();
  if (!id || !rolle) {
    return NextResponse.json({ ok: false, fejl: 'ID og rolle er påkrævet.' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(id, {
    user_metadata: { rolle },
  });

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ ok: false, fejl: 'Bruger-ID mangler.' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
