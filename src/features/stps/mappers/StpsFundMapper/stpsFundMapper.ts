// src/features/stps/mappers/StpsFundMapper/stpsFundMapper.ts

import type { StpsFundNiveau } from '@/features/stps/types/stps.types';
import {
  STPS_SANKTIONER,
  STPS_TYPE_TAGS,
  STPS_REGIONER,
  STPS_TILSYNSFORMER,
  STPS_TEMAER,
} from '@/features/stps/constants/StpsConstants';

// Påbud er alvorligst, henstilling mindst alvorlig
const SANKTION_RANG: Record<string, number> = {
  henstilling:   1,
  indskærpelse:  2,
  påbud:         3,
};

const SANKTION_TIL_NIVEAU: Record<string, StpsFundNiveau> = {
  henstilling:   'mindre',
  indskærpelse:  'stoerre',
  påbud:         'kritisk',
};

export function mapSanktionerTilFundNiveau(tags: string[]): StpsFundNiveau {
  const normalized = tags.map((t) => t.toLowerCase().trim());

  let hoejesteRang = 0;
  let resultat: StpsFundNiveau = 'ingen';

  for (const sanktion of STPS_SANKTIONER) {
    const rang = SANKTION_RANG[sanktion];
    if (normalized.some((t) => t.includes(sanktion)) && rang > hoejesteRang) {
      hoejesteRang = rang;
      resultat = SANKTION_TIL_NIVEAU[sanktion];
    }
  }

  return resultat;
}

export function udtraekSanktioner(tags: string[]): string[] {
  const normalized = tags.map((t) => t.toLowerCase().trim());
  return STPS_SANKTIONER.filter((s) => normalized.some((t) => t.includes(s)));
}

export function udtraekFokusOmraader(tags: string[]): string[] {
  return tags.filter((tag) => {
    const lower = tag.toLowerCase().trim();

    const erSanktion = STPS_SANKTIONER.some((s) => lower.includes(s));
    const erSanktionLabel = lower.startsWith('sanktion:');
    const erType = STPS_TYPE_TAGS.has(lower);
    const erRegion = STPS_REGIONER.has(lower);
    const erKommune = lower.endsWith('kommune');
    const erTilsynsform = STPS_TILSYNSFORMER.has(lower);
    const erKategori = lower === 'bosted' || lower === 'tilsyn' || lower === 'tilsynsrapport';

    return !erSanktion && !erSanktionLabel && !erType && !erRegion && !erKommune && !erTilsynsform && !erKategori;
  });
}

export function udtraekKommune(tags: string[]): string | null {
  const kommuneTag = tags.find((t) => t.toLowerCase().endsWith('kommune'));
  return kommuneTag ?? null;
}

export function udtraekRegion(tags: string[]): string | null {
  return (
    tags.find((t) => STPS_REGIONER.has(t.toLowerCase().trim())) ?? null
  );
}

export function udtraekTilsynsform(tags: string[]): string | null {
  return (
    tags.find((t) => STPS_TILSYNSFORMER.has(t.toLowerCase().trim())) ?? null
  );
}

export function udtraekTemaer(tags: string[]): string[] {
  return tags.filter((t) => STPS_TEMAER.has(t.toLowerCase().trim()));
}
