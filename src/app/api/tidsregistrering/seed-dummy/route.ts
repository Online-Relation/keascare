// src/app/api/tidsregistrering/seed-dummy/route.ts
// Engangsroute: opretter demo-tidsregistreringer for en given bruger,
// fordelt over blandede kategorier på hver hverdag fra 1. januar til i dag.
// Bruges kun til at vise hvordan tidsregistrering ser ud i praksis.

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

type Kategori = { id: string; navn: string };
type Underpunkt = { id: string; kategori_id: string; navn: string };

// Simpel deterministisk pseudo-random ud fra et seed-tal, så kørslen er reproducerbar
function lavRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-scraper-secret') ?? '';
  if (!secret || secret !== process.env.SCRAPER_SECRET) {
    return NextResponse.json({ ok: false, fejl: 'Ingen adgang' }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: false, fejl: 'Mangler email' }, { status: 400 });

  const supabase = getSupabaseServerClient();

  // Find bruger via email
  const { data: brugerListe, error: brugerFejl } = await supabase.auth.admin.listUsers();
  if (brugerFejl) return NextResponse.json({ ok: false, fejl: brugerFejl.message }, { status: 500 });

  const bruger = brugerListe.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!bruger) return NextResponse.json({ ok: false, fejl: `Bruger ${email} ikke fundet` }, { status: 404 });

  // Hent aktive kategorier + underpunkter
  const { data: kategorier } = await supabase
    .from('tidsregistrering_kategorier')
    .select('id, navn')
    .eq('aktiv', true) as { data: Kategori[] | null };

  if (!kategorier || kategorier.length === 0) {
    return NextResponse.json({ ok: false, fejl: 'Ingen aktive kategorier fundet' }, { status: 400 });
  }

  const { data: underpunkter } = await supabase
    .from('tidsregistrering_underpunkter')
    .select('id, kategori_id, navn')
    .eq('aktiv', true) as { data: Underpunkt[] | null };

  const underpunkterPrKategori = new Map<string, Underpunkt[]>();
  for (const up of underpunkter ?? []) {
    const liste = underpunkterPrKategori.get(up.kategori_id) ?? [];
    liste.push(up);
    underpunkterPrKategori.set(up.kategori_id, liste);
  }

  const noter = [
    'Telefonmøde',
    'Opfølgning pr. mail',
    'Fysisk besøg',
    'Gennemgang af dokumentation',
    'Forberedelse',
    null,
    null,
  ];

  const rng = lavRng(42);
  const dagsIndslag: { start: Date; slut: Date; kategoriId: string; underpunktId: string | null; underpunktNavn: string | null; note: string | null }[] = [];

  const start = new Date('2026-01-01T00:00:00');
  const iDag = new Date();

  for (let d = new Date(start); d <= iDag; d.setDate(d.getDate() + 1)) {
    const ugedag = d.getDay();
    if (ugedag === 0 || ugedag === 6) continue; // spring weekender over

    // 3-5 registreringer pr. dag, blandede kategorier
    const antalIDag = 3 + Math.floor(rng() * 3);
    let klokken = 8 * 60 + Math.floor(rng() * 30); // start ml. 08:00-08:30

    for (let i = 0; i < antalIDag; i++) {
      const kategori = kategorier[Math.floor(rng() * kategorier.length)];
      const muligeUnderpunkter = underpunkterPrKategori.get(kategori.id) ?? [];
      const underpunkt = muligeUnderpunkter.length > 0
        ? muligeUnderpunkter[Math.floor(rng() * muligeUnderpunkter.length)]
        : null;

      const varighed = 20 + Math.floor(rng() * 100); // 20-120 min

      const startTid = new Date(d);
      startTid.setHours(0, 0, 0, 0);
      startTid.setMinutes(klokken);

      const slutTid = new Date(startTid);
      slutTid.setMinutes(startTid.getMinutes() + varighed);

      dagsIndslag.push({
        start: startTid,
        slut: slutTid,
        kategoriId: kategori.id,
        underpunktId: underpunkt?.id ?? null,
        underpunktNavn: underpunkt?.navn ?? null,
        note: noter[Math.floor(rng() * noter.length)],
      });

      klokken = slutTid.getHours() * 60 + slutTid.getMinutes() + 5 + Math.floor(rng() * 20); // 5-25 min pause
      if (klokken > 17 * 60) break; // ikke efter kl. 17
    }
  }

  const rækker = dagsIndslag.map((i) => ({
    bruger_id: bruger.id,
    kategori_id: i.kategoriId,
    underpunkt_id: i.underpunktId,
    underpunkt_navn: i.underpunktNavn,
    start_tid: i.start.toISOString(),
    slut_tid: i.slut.toISOString(),
    varighed_minutter: Math.round((i.slut.getTime() - i.start.getTime()) / 60000),
    note: i.note,
  }));

  // Indsæt i batches af 200
  let indsat = 0;
  for (let i = 0; i < rækker.length; i += 200) {
    const batch = rækker.slice(i, i + 200);
    const { error } = await supabase.from('tidsregistreringer').insert(batch);
    if (error) return NextResponse.json({ ok: false, fejl: error.message, indsatIndtilFejl: indsat }, { status: 500 });
    indsat += batch.length;
  }

  return NextResponse.json({ ok: true, bruger: email, antalRegistreringer: indsat });
}
