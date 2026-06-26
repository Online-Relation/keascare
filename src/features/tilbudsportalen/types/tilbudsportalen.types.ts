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
  pNummer: string | null;
  kommune: string | null;
  kontaktperson: string | null;
  telefon: string | null;
  email: string | null;
  driftsform: string | null;
  tilbuddetsAdresse: string | null;
  leder: string | null;
  website: string | null;
  virksomhedsNavn: string | null;
  tilsynsmyndighed: string | null;
  pladsePrParagraf: string | null;
};

export type TilbudsportalenMatchResultat = {
  matchet: number;
  ingenCvr: number;
  ingenMatch: number;
};
