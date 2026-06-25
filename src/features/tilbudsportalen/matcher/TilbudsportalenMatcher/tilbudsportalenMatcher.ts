// src/features/tilbudsportalen/matcher/TilbudsportalenMatcher/tilbudsportalenMatcher.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { TilbudsportalenMatchResultat } from '@/features/tilbudsportalen/types/tilbudsportalen.types';

export async function matchTilbudsportalenTilStps(): Promise<TilbudsportalenMatchResultat> {
  const supabase = getSupabaseServerClient();

  // Hent alle Tilbudsportalen-tilbud med CVR
  const { data: tilbud, error: tilbudFejl } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('cvr, tilbudstype, pladser')
    .not('cvr', 'is', null);

  if (tilbudFejl) throw new Error(`Tilbudsportalen fejl: ${tilbudFejl.message}`);

  const tilbudMap = new Map<string, { tilbudstype: string | null; pladser: number | null }>();
  for (const t of tilbud ?? []) {
    if (t.cvr) tilbudMap.set(t.cvr.trim(), { tilbudstype: t.tilbudstype, pladser: t.pladser });
  }

  // Hent alle STPS-rapporter med CVR
  const { data: rapporter, error: stpsFejl } = await supabase
    .from('stps_rapporter')
    .select('id, cvr')
    .not('cvr', 'is', null);

  if (stpsFejl) throw new Error(`STPS fejl: ${stpsFejl.message}`);

  let matchet = 0;
  let ingenMatch = 0;
  const ingenCvr = 0;

  for (const rapport of rapporter ?? []) {
    const match = tilbudMap.get(rapport.cvr?.trim() ?? '');
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
