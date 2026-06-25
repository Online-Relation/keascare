// src/features/tilbudsportalen/types/tilbudsportalen.types.ts

export type TilbudsportalenListeItem = {
  tilbudsid: string;
  afdelingsid: string;
  navn: string;
  url: string;
};

export type TilbudsportalenDetalje = {
  tilbudsid: string;
  afdelingsid: string;
  cvr: string | null;
  tilbudstype: string | null;
  pladser: number | null;
};

export type TilbudsportalenMatchResultat = {
  matchet: number;
  ingenCvr: number;
  ingenMatch: number;
};
