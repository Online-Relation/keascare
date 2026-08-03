// src/features/varsletTilsyn/services/VarsletTilsynService/varsletTilsynService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { VarsletTilsyn } from '@/features/varsletTilsyn/types/varsletTilsyn.types';

type DbRow = {
  id: string;
  bosted_id: string;
  bosted_navn: string;
  kommune: string | null;
  seneste_rapport_dato: string | null;
  noter: string | null;
  oprettet_af: string | null;
  oprettet_dato: string;
};

function mapRow(r: DbRow): VarsletTilsyn {
  return {
    id: r.id,
    bostedId: r.bosted_id,
    bostedNavn: r.bosted_navn,
    kommune: r.kommune,
    senesteRapportDato: r.seneste_rapport_dato,
    noter: r.noter,
    oprettetAf: r.oprettet_af,
    oprettetDato: r.oprettet_dato,
  };
}

export async function hentAlleVarslinger(): Promise<VarsletTilsyn[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('varslet_tilsyn')
    .select('*')
    .order('oprettet_dato', { ascending: false });
  return (data ?? []).map(mapRow);
}

export async function hentVarsling(id: string): Promise<VarsletTilsyn | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('varslet_tilsyn')
    .select('*')
    .eq('id', id)
    .single();
  return data ? mapRow(data as DbRow) : null;
}

export async function erBostedVarslet(bostedId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('varslet_tilsyn')
    .select('id')
    .eq('bosted_id', bostedId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function opretVarsling(
  bostedId: string,
  bostedNavn: string,
  kommune: string | null,
  senesteRapportDato: string | null,
  oprettetAf: string | null,
): Promise<VarsletTilsyn | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('varslet_tilsyn')
    .insert({ bosted_id: bostedId, bosted_navn: bostedNavn, kommune, seneste_rapport_dato: senesteRapportDato, oprettet_af: oprettetAf })
    .select()
    .single();
  return data ? mapRow(data as DbRow) : null;
}

export async function fjernVarsling(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.from('varslet_tilsyn').delete().eq('id', id);
}

export async function fjernVarslingForBosted(bostedId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.from('varslet_tilsyn').delete().eq('bosted_id', bostedId);
}

export async function opdaterNoter(id: string, noter: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.from('varslet_tilsyn').update({ noter }).eq('id', id);
}

export async function hentAntalVarslinger(): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { count } = await supabase
    .from('varslet_tilsyn')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}
