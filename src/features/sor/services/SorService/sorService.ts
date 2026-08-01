// src/features/sor/services/SorService/sorService.ts
// Læser SOR-cache fra Supabase og laver match mod Monday-bosteder

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type SorCacheEnhed = {
  sorKode: string;
  navn: string;
  cvr: string | null;
  adresse: string | null;
  postnummer: string | null;
  by: string | null;
};

function normaliserNavn(navn: string): string {
  return navn
    .toLowerCase()
    .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export async function hentSorCache(): Promise<SorCacheEnhed[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('sor_bosteder_cache')
    .select('sor_kode, navn, cvr, adresse, postnummer, by')
    .eq('aktiv', true);

  if (error) throw error;

  return (data ?? []).map((r) => ({
    sorKode: r.sor_kode,
    navn: r.navn,
    cvr: r.cvr,
    adresse: r.adresse,
    postnummer: r.postnummer,
    by: r.by,
  }));
}

export async function hentSorSidstSynkroniseret(): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('sor_bosteder_cache')
    .select('synkroniseret')
    .order('synkroniseret', { ascending: false })
    .limit(1)
    .single();
  return data?.synkroniseret ?? null;
}

// Bygger et map: cvr/navn → SOR-enhed, bruges til badge-visning
export function bygSorMatchMap(
  sorEnheder: SorCacheEnhed[],
  bosteder: { navn: string; cvr?: string | null }[]
): Record<string, SorCacheEnhed | null> {
  const result: Record<string, SorCacheEnhed | null> = {};

  const cvrIndex = new Map<string, SorCacheEnhed>();
  for (const enhed of sorEnheder) {
    if (enhed.cvr) cvrIndex.set(enhed.cvr.replace(/\s/g, ''), enhed);
  }

  const navnIndex = new Map<string, SorCacheEnhed>();
  for (const enhed of sorEnheder) {
    navnIndex.set(normaliserNavn(enhed.navn), enhed);
  }

  for (const bosted of bosteder) {
    const normNavn = normaliserNavn(bosted.navn);
    const cvrRen = bosted.cvr?.replace(/\s/g, '') ?? null;

    // Prioriter CVR-match
    if (cvrRen && cvrIndex.has(cvrRen)) {
      result[bosted.navn] = cvrIndex.get(cvrRen)!;
      continue;
    }

    // Eksakt navn-match
    if (navnIndex.has(normNavn)) {
      result[bosted.navn] = navnIndex.get(normNavn)!;
      continue;
    }

    // Fuzzy: SOR-navn indeholder bosted-navn eller omvendt
    let fuzzyMatch: SorCacheEnhed | null = null;
    for (const [sorNorm, enhed] of navnIndex) {
      if (sorNorm.includes(normNavn) || normNavn.includes(sorNorm)) {
        fuzzyMatch = enhed;
        break;
      }
    }
    result[bosted.navn] = fuzzyMatch;
  }

  return result;
}

// Returnerer SOR-enheder der IKKE matcher nogen af de kendte bosteder (potentielle nye leads)
export function hentUmatchedeSorEnheder(
  sorEnheder: SorCacheEnhed[],
  mundayNavne: string[],
  mundayCvr: (string | null)[]
): SorCacheEnhed[] {
  const kendte = new Set(mundayNavne.map(normaliserNavn));
  const kendteCvr = new Set(mundayCvr.filter(Boolean).map((c) => c!.replace(/\s/g, '')));

  return sorEnheder.filter((e) => {
    if (e.cvr && kendteCvr.has(e.cvr.replace(/\s/g, ''))) return false;
    const norm = normaliserNavn(e.navn);
    if (kendte.has(norm)) return false;
    // Fuzzy: tjek om noget kendt navn ligner
    for (const k of kendte) {
      if (norm.includes(k) || k.includes(norm)) return false;
    }
    return true;
  });
}
