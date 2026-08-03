// src/features/varsletTilsyn/services/VarsletTilsynService/sandsynlighedService.ts

import { hentAlleInspektoerer } from '@/features/stps/services/StpsInspektoerService';
import type { SandsynligInspektoer } from '@/features/varsletTilsyn/types/varsletTilsyn.types';

export async function beregnSandsynligeInspektoerer(kommune: string | null): Promise<SandsynligInspektoer[]> {
  if (!kommune) return [];

  const alleInspektoerer = await hentAlleInspektoerer();
  const kortNavn = kommune.replace(/\s+[Kk]ommune$/, '').trim();

  const kandidater = alleInspektoerer
    .map((ins) => {
      const antalIKommune = ins.rapporter.filter(
        (r) => r.kommune === kommune || r.kommune === kortNavn
      ).length;
      if (antalIKommune === 0) return null;

      // Typiske samarbejdspartnere
      const typiskMed = ins.kolleger
        .filter((k) => k.antalSammen >= 5)
        .slice(0, 2)
        .map((k) => k.navn.split(' ')[0]);

      return {
        navn: ins.navn,
        slug: ins.slug,
        titel: ins.titel,
        antalIKommune,
        score: antalIKommune,
        typiskMed,
      };
    })
    .filter((x): x is SandsynligInspektoer => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return kandidater;
}
