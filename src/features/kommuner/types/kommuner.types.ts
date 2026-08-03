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

export type KommuneInspektoer = {
  navn: string;
  slug: string;
  titel: string | null;
  antalIKommune: number;
};

export type KommuneFundFordeling = {
  niveau: string;
  antal: number;
};

export type KommuneDetail = {
  navn: string;
  p107: number;
  p108: number;
  totalBorgere: number;
  bosteder: KommuneBosted[];
  inspektoerer: KommuneInspektoer[];
  fundFordeling: KommuneFundFordeling[];
  antalKritiske: number;
  senesteDato: string | null;
};
