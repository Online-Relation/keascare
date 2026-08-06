// src/app/api/medarbejdere/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type DbMedarbejder = {
  id: string;
  navn: string;
  stillingsbetegnelse: string | null;
  telefon: string | null;
  email: string | null;
  bruger_id: string | null;
  aktiv: boolean;
  oprettet: string;
};

export async function GET() {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('medarbejdere')
    .select('id, navn, stillingsbetegnelse, telefon, email, bruger_id, aktiv, oprettet')
    .order('navn');

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 500 });

  const rækker = (data ?? []) as DbMedarbejder[];

  // Slå bruger-emails op for dem der er knyttet til en eksisterende bruger
  const brugerIds = [...new Set(rækker.map((r) => r.bruger_id).filter(Boolean))] as string[];
  const brugerEmailMap = new Map<string, string>();
  if (brugerIds.length > 0) {
    const { data: brugerListe } = await supabase.auth.admin.listUsers();
    for (const u of brugerListe?.users ?? []) {
      if (u.id && u.email && brugerIds.includes(u.id)) brugerEmailMap.set(u.id, u.email);
    }
  }

  const medarbejdere = rækker.map((r) => ({
    id:                  r.id,
    navn:                r.navn,
    stillingsbetegnelse: r.stillingsbetegnelse,
    telefon:             r.telefon,
    email:               r.email,
    brugerId:            r.bruger_id,
    brugerEmail:         r.bruger_id ? brugerEmailMap.get(r.bruger_id) ?? null : null,
    aktiv:               r.aktiv,
    oprettet:            r.oprettet,
  }));

  return NextResponse.json({ ok: true, medarbejdere });
}

export async function POST(req: Request) {
  const { navn, stillingsbetegnelse, telefon, email, brugerId } = await req.json();
  if (!navn) return NextResponse.json({ ok: false, fejl: 'Navn er påkrævet.' }, { status: 400 });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('medarbejdere')
    .insert({
      navn,
      stillingsbetegnelse: stillingsbetegnelse ?? null,
      telefon: telefon ?? null,
      email: email ?? null,
      bruger_id: brugerId ?? null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(req: Request) {
  const { id, navn, stillingsbetegnelse, telefon, email, brugerId, aktiv } = await req.json();
  if (!id) return NextResponse.json({ ok: false, fejl: 'ID mangler.' }, { status: 400 });

  const felter: Record<string, unknown> = {};
  if (navn !== undefined) felter.navn = navn;
  if (stillingsbetegnelse !== undefined) felter.stillingsbetegnelse = stillingsbetegnelse;
  if (telefon !== undefined) felter.telefon = telefon;
  if (email !== undefined) felter.email = email;
  if (brugerId !== undefined) felter.bruger_id = brugerId;
  if (aktiv !== undefined) felter.aktiv = aktiv;

  const supabase = getAdminClient();
  const { error } = await supabase.from('medarbejdere').update(felter).eq('id', id);

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ ok: false, fejl: 'ID mangler.' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('medarbejdere').delete().eq('id', id);

  if (error) return NextResponse.json({ ok: false, fejl: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
