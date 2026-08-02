// src/features/tidsregistrering/services/TidsregistreringService/tidsregistreringService.ts

import { getSupabaseAuthBrowserClient } from '@/lib/db/SupabaseClient/supabaseAuthClient';
import type { Tidsregistrering, TidsregistreringKategori, TidsregistreringUnderpunkt } from '@/features/tidsregistrering/types/tidsregistrering.types';

function supabase() {
  return getSupabaseAuthBrowserClient();
}

export async function hentKategorier(): Promise<TidsregistreringKategori[]> {
  const { data, error } = await supabase()
    .from('tidsregistrering_kategorier')
    .select('id, navn, aktiv, oprettet')
    .eq('aktiv', true)
    .order('oprettet');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    navn: r.navn,
    aktiv: r.aktiv,
    oprettet: r.oprettet,
  }));
}

export async function hentAlleKategorier(): Promise<TidsregistreringKategori[]> {
  const { data, error } = await supabase()
    .from('tidsregistrering_kategorier')
    .select('id, navn, aktiv, oprettet')
    .order('oprettet');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    navn: r.navn,
    aktiv: r.aktiv,
    oprettet: r.oprettet,
  }));
}

export async function opretKategori(navn: string): Promise<void> {
  const { error } = await supabase()
    .from('tidsregistrering_kategorier')
    .insert({ navn });
  if (error) throw error;
}

export async function opdaterKategori(id: string, navn: string): Promise<void> {
  const { error } = await supabase()
    .from('tidsregistrering_kategorier')
    .update({ navn })
    .eq('id', id);
  if (error) throw error;
}

export async function skiftKategoriAktiv(id: string, aktiv: boolean): Promise<void> {
  const { error } = await supabase()
    .from('tidsregistrering_kategorier')
    .update({ aktiv })
    .eq('id', id);
  if (error) throw error;
}

export async function hentUnderpunkter(kategoriId: string): Promise<TidsregistreringUnderpunkt[]> {
  const { data, error } = await supabase()
    .from('tidsregistrering_underpunkter')
    .select('id, kategori_id, navn, aktiv, oprettet')
    .eq('kategori_id', kategoriId)
    .order('oprettet');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    kategoriId: r.kategori_id,
    navn: r.navn,
    aktiv: r.aktiv,
    oprettet: r.oprettet,
  }));
}

export async function hentAlleUnderpunkterForKategorier(): Promise<TidsregistreringUnderpunkt[]> {
  const { data, error } = await supabase()
    .from('tidsregistrering_underpunkter')
    .select('id, kategori_id, navn, aktiv, oprettet')
    .order('oprettet');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    kategoriId: r.kategori_id,
    navn: r.navn,
    aktiv: r.aktiv,
    oprettet: r.oprettet,
  }));
}

export async function opretUnderpunkt(kategoriId: string, navn: string): Promise<void> {
  const { error } = await supabase()
    .from('tidsregistrering_underpunkter')
    .insert({ kategori_id: kategoriId, navn });
  if (error) throw error;
}

export async function opdaterUnderpunkt(id: string, navn: string): Promise<void> {
  const { error } = await supabase()
    .from('tidsregistrering_underpunkter')
    .update({ navn })
    .eq('id', id);
  if (error) throw error;
}

export async function skiftUnderpunktAktiv(id: string, aktiv: boolean): Promise<void> {
  const { error } = await supabase()
    .from('tidsregistrering_underpunkter')
    .update({ aktiv })
    .eq('id', id);
  if (error) throw error;
}

export async function startTimer(kategoriId: string): Promise<string> {
  const { data: { user } } = await supabase().auth.getUser();
  if (!user) throw new Error('Ikke logget ind');

  const { data, error } = await supabase()
    .from('tidsregistreringer')
    .insert({ bruger_id: user.id, kategori_id: kategoriId, start_tid: new Date().toISOString() })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function stopTimer(id: string, note?: string, underpunktId?: string, underpunktNavn?: string): Promise<void> {
  const slutTid = new Date().toISOString();
  const { data, error } = await supabase()
    .from('tidsregistreringer')
    .select('start_tid')
    .eq('id', id)
    .single();
  if (error) throw error;

  const varighedMs = new Date(slutTid).getTime() - new Date(data.start_tid).getTime();
  const varighedMinutter = Math.round(varighedMs / 60000);

  const { error: updateFejl } = await supabase()
    .from('tidsregistreringer')
    .update({
      slut_tid: slutTid,
      varighed_minutter: varighedMinutter,
      note: note ?? null,
      underpunkt_id: underpunktId ?? null,
      underpunkt_navn: underpunktNavn ?? null,
    })
    .eq('id', id);
  if (updateFejl) throw updateFejl;
}

export async function hentAktivitetsKalenderData(dage = 182): Promise<{ dato: string; minutter: number }[]> {
  const fra = new Date();
  fra.setDate(fra.getDate() - dage);
  const { data, error } = await supabase()
    .from('tidsregistreringer')
    .select('start_tid, varighed_minutter')
    .not('slut_tid', 'is', null)
    .gte('start_tid', fra.toISOString())
    .order('start_tid');
  if (error) throw error;
  const dagMap = new Map<string, number>();
  for (const r of data ?? []) {
    const dato = r.start_tid.slice(0, 10);
    dagMap.set(dato, (dagMap.get(dato) ?? 0) + (r.varighed_minutter ?? 0));
  }
  return [...dagMap.entries()].map(([dato, minutter]) => ({ dato, minutter }));
}

export async function hentUgentligKategoriData(uger = 8): Promise<Tidsregistrering[]> {
  const fra = new Date();
  fra.setDate(fra.getDate() - uger * 7);
  const { data, error } = await supabase()
    .from('tidsregistreringer')
    .select('id, bruger_id, kategori_id, tidsregistrering_kategorier(navn), underpunkt_id, underpunkt_navn, start_tid, slut_tid, varighed_minutter, note, oprettet')
    .not('slut_tid', 'is', null)
    .gte('start_tid', fra.toISOString())
    .order('start_tid');
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    brugerId: r.bruger_id,
    kategoriId: r.kategori_id,
    kategoriNavn: (r.tidsregistrering_kategorier as unknown as { navn: string } | null)?.navn ?? '—',
    underpunktId: r.underpunkt_id ?? null,
    underpunktNavn: r.underpunkt_navn ?? null,
    startTid: r.start_tid,
    slutTid: r.slut_tid,
    varighedMinutter: r.varighed_minutter,
    note: r.note,
    oprettet: r.oprettet,
  }));
}

export async function hentRegistreringerIPeriode(fra: Date, til: Date): Promise<Tidsregistrering[]> {
  const { data, error } = await supabase()
    .from('tidsregistreringer')
    .select('id, bruger_id, kategori_id, tidsregistrering_kategorier(navn), underpunkt_id, underpunkt_navn, start_tid, slut_tid, varighed_minutter, note, oprettet')
    .not('slut_tid', 'is', null)
    .gte('start_tid', fra.toISOString())
    .lte('start_tid', til.toISOString())
    .order('start_tid', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    brugerId: r.bruger_id,
    kategoriId: r.kategori_id,
    kategoriNavn: (r.tidsregistrering_kategorier as unknown as { navn: string } | null)?.navn ?? '—',
    underpunktId: r.underpunkt_id ?? null,
    underpunktNavn: r.underpunkt_navn ?? null,
    startTid: r.start_tid,
    slutTid: r.slut_tid,
    varighedMinutter: r.varighed_minutter,
    note: r.note,
    oprettet: r.oprettet,
  }));
}

export async function hentRegistreringer(limit = 100): Promise<Tidsregistrering[]> {
  const { data, error } = await supabase()
    .from('tidsregistreringer')
    .select('id, bruger_id, kategori_id, tidsregistrering_kategorier(navn), underpunkt_id, underpunkt_navn, start_tid, slut_tid, varighed_minutter, note, oprettet')
    .not('slut_tid', 'is', null)
    .order('start_tid', { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    brugerId: r.bruger_id,
    kategoriId: r.kategori_id,
    kategoriNavn: (r.tidsregistrering_kategorier as unknown as { navn: string } | null)?.navn ?? '—',
    underpunktId: r.underpunkt_id ?? null,
    underpunktNavn: r.underpunkt_navn ?? null,
    startTid: r.start_tid,
    slutTid: r.slut_tid,
    varighedMinutter: r.varighed_minutter,
    note: r.note,
    oprettet: r.oprettet,
  }));
}

export async function sletKategori(id: string): Promise<void> {
  const { error: regFejl } = await supabase()
    .from('tidsregistreringer')
    .delete()
    .eq('kategori_id', id);
  if (regFejl) throw regFejl;

  const { error: upFejl } = await supabase()
    .from('tidsregistrering_underpunkter')
    .delete()
    .eq('kategori_id', id);
  if (upFejl) throw upFejl;

  const { error } = await supabase()
    .from('tidsregistrering_kategorier')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function sletUnderpunkt(id: string): Promise<void> {
  const { error } = await supabase()
    .from('tidsregistrering_underpunkter')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function opdaterNote(id: string, note: string): Promise<void> {
  const { error } = await supabase()
    .from('tidsregistreringer')
    .update({ note })
    .eq('id', id);
  if (error) throw error;
}

export async function sletRegistrering(id: string): Promise<void> {
  const { error } = await supabase()
    .from('tidsregistreringer')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
