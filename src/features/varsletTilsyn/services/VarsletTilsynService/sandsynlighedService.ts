// src/features/varsletTilsyn/services/VarsletTilsynService/sandsynlighedService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { erPersonNavn, navnTilSlug } from '@/features/stps/services/StpsInspektoerService';
import type { SandsynligInspektoer } from '@/features/varsletTilsyn/types/varsletTilsyn.types';
import type { TilsynDeltager } from '@/features/stps/scraper/StpsPdfParser';

type DbRapport = {
  id: string;
  kommune: string | null;
  region: string | null;
  temaer: string[] | null;
  tilsyn_deltagere_stps: TilsynDeltager[] | null;
};

export async function beregnSandsynligeInspektoerer(kommune: string | null): Promise<SandsynligInspektoer[]> {
  if (!kommune) return [];

  const supabase = getSupabaseServerClient();
  const kortNavn = kommune.replace(/\s+[Kk]ommune$/, '').trim();

  // Hent alle rapporter i kommunen med deltagerdata
  const { data } = await supabase
    .from('stps_rapporter')
    .select('id, kommune, region, temaer, tilsyn_deltagere_stps')
    .not('tilsyn_deltagere_stps', 'is', null)
    .or(`kommune.eq."${kommune}",kommune.eq."${kortNavn}"`);

  const rapporter = (data ?? []) as DbRapport[];

  if (rapporter.length === 0) return [];

  // Tæl deltagere og temaer
  const deltagerMap = new Map<string, {
    titel: string | null;
    antal: number;
    temaer: Map<string, number>;
  }>();

  for (const r of rapporter) {
    if (!r.tilsyn_deltagere_stps) continue;
    for (const d of r.tilsyn_deltagere_stps) {
      if (!d.titel || d.titel.toLowerCase().includes('ikke angivet')) continue;
      if (!erPersonNavn(d.navn)) continue;
      const nøgle = d.navn.toLowerCase().trim();
      const eks = deltagerMap.get(nøgle);
      if (!eks) {
        const temaMap = new Map<string, number>();
        for (const t of r.temaer ?? []) temaMap.set(t, 1);
        deltagerMap.set(nøgle, { titel: d.titel ?? null, antal: 1, temaer: temaMap });
      } else {
        eks.antal++;
        for (const t of r.temaer ?? []) {
          eks.temaer.set(t, (eks.temaer.get(t) ?? 0) + 1);
        }
      }
    }
  }

  return [...deltagerMap.entries()]
    .sort((a, b) => b[1].antal - a[1].antal)
    .slice(0, 6)
    .map(([nøgle, v]) => {
      const navn = nøgle.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const typiskeFokus = [...v.temaer.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([tema]) => tema);
      return {
        navn,
        slug: navnTilSlug(navn),
        titel: v.titel,
        antalIKommune: v.antal,
        score: v.antal,
        typiskMed: [],
        typiskeFokus,
      };
    });
}
