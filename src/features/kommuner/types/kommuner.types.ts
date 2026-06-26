// src/features/kommuner/types/kommuner.types.ts

export type KommuneOversigt = {
  navn: string;
  p107: number;
  p108: number;
  totalBorgere: number;
  antalBosteder: number;
};

export type KommuneBosted = {
  id: string;
  navn: string;
  fundNiveau: string;
  rapportDato: string | null;
  rapportLink: string | null;
  tilsynsform: string | null;
  temaer: string[];
};

export type KommuneDetail = {
  navn: string;
  p107: number;
  p108: number;
  totalBorgere: number;
  bosteder: KommuneBosted[];
};
