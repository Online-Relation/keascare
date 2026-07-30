// src/features/stps/services/StpsInspektoerService/stpsInspektoerService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { TilsynDeltager } from '@/features/stps/scraper/StpsPdfParser';

export type InspektoerStat = {
  navn: string;
  titel: string | null;
  antal: number;
  senesteDato: string | null;
};

type DbRapport = {
  id: string;
  stps_tilbud_navn: string;
  rapport_dato: string | null;
  tilsyn_deltagere_stps: TilsynDeltager[] | null;
};

export async function hentInspektoerStatistik(): Promise<InspektoerStat[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, rapport_dato, tilsyn_deltagere_stps')
    .not('tilsyn_deltagere_stps', 'is', null);

  if (error || !data) return [];

  const tælling = new Map<string, { titel: string | null; antal: number; senesteDato: string | null }>();

  for (const r of data as DbRapport[]) {
    if (!r.tilsyn_deltagere_stps) continue;
    for (const d of r.tilsyn_deltagere_stps) {
      const nøgle = d.navn.toLowerCase().trim();
      const eksist = tælling.get(nøgle);
      const dato = r.rapport_dato ?? null;
      if (!eksist) {
        tælling.set(nøgle, { titel: d.titel, antal: 1, senesteDato: dato });
      } else {
        const nyDato = dato && (!eksist.senesteDato || dato > eksist.senesteDato) ? dato : eksist.senesteDato;
        tælling.set(nøgle, { ...eksist, antal: eksist.antal + 1, senesteDato: nyDato });
      }
    }
  }

  return Array.from(tælling.entries())
    .map(([nøgle, v]) => ({
      navn: nøgle.replace(/\b\w/g, (c) => c.toUpperCase()),
      titel: v.titel,
      antal: v.antal,
      senesteDato: v.senesteDato,
    }))
    .sort((a, b) => b.antal - a.antal);
}
