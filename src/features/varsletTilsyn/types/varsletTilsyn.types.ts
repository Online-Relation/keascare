// src/features/varsletTilsyn/types/varsletTilsyn.types.ts

export type SandsynligInspektoer = {
  navn: string;
  slug: string;
  titel: string | null;
  antalIKommune: number;
  score: number;
  typiskMed: string[];
  typiskeFokus: string[];
};

export type VarsletTilsyn = {
  id: string;
  bostedId: string;
  bostedNavn: string;
  kommune: string | null;
  senesteRapportDato: string | null;
  noter: string | null;
  oprettetAf: string | null;
  oprettetDato: string;
};
