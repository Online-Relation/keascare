// src/features/tilbudsportalen/matcher/TilbudsportalenMatcher/tilbudsportalenMatcher.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { TilbudsportalenMatchResultat } from '@/features/tilbudsportalen/types/tilbudsportalen.types';

type TpTilbud = {
  cvr: string | null;
  navn: string | null;
  tilbudstype: string | null;
  pladser: number | null;
};

type StpsRapport = {
  id: number;
  cvr: string | null;
  navn: string | null;
};

type TpData = { tilbudstype: string | null; pladser: number | null };

function normaliserNavn(navn: string): string {
  return navn
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,\-–]/g, '')
    .trim();
}

function findNavnMatch(stpsNavn: string, navnMap: Map<string, TpData>): TpData | undefined {
  const normStps = normaliserNavn(stpsNavn);
  // Eksakt normaliseret match
  if (navnMap.has(normStps)) return navnMap.get(normStps);
  // Starter-med match (TP-navn indeholder STPS-navn som præfiks)
  for (const [tpNavn, data] of navnMap) {
    if (tpNavn.startsWith(normStps) || normStps.startsWith(tpNavn)) {
      return data;
    }
  }
  return undefined;
}

export async function matchTilbudsportalenTilStps(): Promise<TilbudsportalenMatchResultat> {
  const supabase = getSupabaseServerClient();

  const { data: tilbud, error: tilbudFejl } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('cvr, navn, tilbudstype, pladser');

  if (tilbudFejl) throw new Error(`Tilbudsportalen fejl: ${tilbudFejl.message}`);

  const cvrMap = new Map<string, TpData>();
  const navnMap = new Map<string, TpData>();

  for (const t of (tilbud ?? []) as TpTilbud[]) {
    const data: TpData = { tilbudstype: t.tilbudstype, pladser: t.pladser };
    if (t.cvr) cvrMap.set(t.cvr.trim(), data);
    if (t.navn) navnMap.set(normaliserNavn(t.navn), data);
  }

  const { data: rapporter, error: stpsFejl } = await supabase
    .from('stps_rapporter')
    .select('id, cvr, navn');

  if (stpsFejl) throw new Error(`STPS fejl: ${stpsFejl.message}`);

  let matchet = 0;
  let ingenCvr = 0;
  let ingenMatch = 0;

  for (const rapport of (rapporter ?? []) as StpsRapport[]) {
    let match: TpData | undefined;

    if (rapport.cvr) {
      match = cvrMap.get(rapport.cvr.trim());
    } else {
      ingenCvr++;
    }

    if (!match && rapport.navn) {
      match = findNavnMatch(rapport.navn, navnMap);
    }

    if (!match) { ingenMatch++; continue; }

    await supabase
      .from('stps_rapporter')
      .update({
        tp_tilbudstype: match.tilbudstype,
        tp_pladser: match.pladser?.toString() ?? null,
      })
      .eq('id', rapport.id);

    matchet++;
  }

  return { matchet, ingenCvr, ingenMatch };
}
