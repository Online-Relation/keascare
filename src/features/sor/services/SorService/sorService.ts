// src/features/sor/services/SorService/sorService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export type SorCacheEnhed = {
  sorKode: string;
  navn: string;
  cvr: string | null;
  adresse: string | null;
  postnummer: string | null;
  by: string | null;
  enhedstypeId: string | null;
  enhedstypeNavn: string | null;
};

// Enhedstype-id'er der sandsynligvis er botilbud/sociale tilbud
// 550 = Botilbud, 551 = Midlertidigt botilbud, 560 = Dagtilbud, osv.
// Vi filtrerer dem der klart IKKE er bosteder fra
const UINTERESSANTE_TYPER = new Set([
  '1', '2', '3', '4', '5',   // Sygehuse/regioner
  '6', '7', '8', '9', '10',
  '100', '101', '102',        // Praksissektoren
  '200', '201',               // Apoteker
]);

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
    .select('sor_kode, navn, cvr, adresse, postnummer, by, enhedstype_id, enhedstype_navn')
    .eq('aktiv', true);

  if (error) throw error;

  return (data ?? []).map((r) => ({
    sorKode: r.sor_kode,
    navn: r.navn,
    cvr: r.cvr,
    adresse: r.adresse,
    postnummer: r.postnummer,
    by: r.by,
    enhedstypeId: r.enhedstype_id ?? null,
    enhedstypeNavn: r.enhedstype_navn ?? null,
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

// Bygger et map: bosted-navn → SOR-enhed, bruges til badge-visning på listesider
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

    if (cvrRen && cvrIndex.has(cvrRen)) {
      result[bosted.navn] = cvrIndex.get(cvrRen)!;
      continue;
    }
    if (navnIndex.has(normNavn)) {
      result[bosted.navn] = navnIndex.get(normNavn)!;
      continue;
    }
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

// Henter CVR-numre fra stps_rapporter (vores kendte bosteder)
export async function hentKendteBostederCvr(): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('stps_rapporter')
    .select('cvr')
    .not('cvr', 'is', null);

  return (data ?? [])
    .map((r) => r.cvr?.replace(/[^0-9]/g, '') ?? '')
    .filter((c) => c.length > 0);
}

// Returnerer SOR-enheder der IKKE er matchet i stps_rapporter (via CVR)
export function hentUmatchedeSorEnheder(
  sorEnheder: SorCacheEnhed[],
  kendteCvr: string[],
): SorCacheEnhed[] {
  const kendteCvrSet = new Set(kendteCvr);

  return sorEnheder.filter((e) => {
    const cvrRen = e.cvr?.replace(/[^0-9]/g, '') ?? null;
    if (cvrRen && kendteCvrSet.has(cvrRen)) return false;
    return true;
  });
}

// Returnerer alle unikke enhedstyper i datasættet (til filter-UI)
export function udtrækEnhedstyper(sorEnheder: SorCacheEnhed[]): { id: string; navn: string }[] {
  const map = new Map<string, string>();
  for (const e of sorEnheder) {
    if (e.enhedstypeId && e.enhedstypeNavn && !map.has(e.enhedstypeId)) {
      map.set(e.enhedstypeId, e.enhedstypeNavn);
    }
  }
  return Array.from(map.entries())
    .map(([id, navn]) => ({ id, navn }))
    .sort((a, b) => a.navn.localeCompare(b.navn, 'da'));
}
