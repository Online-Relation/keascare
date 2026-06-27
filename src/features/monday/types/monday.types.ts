// src/features/monday/types/monday.types.ts

export type MondayGruppe = 'nye_forloeb' | 'aktive_forloeb' | 'ukendt';

export type MondayKundeItem = {
  mondayId: string;
  navn: string;
  gruppe: MondayGruppe;
  gruppeNavn: string;
  adresse: string | null;
  email: string | null;
  website: string | null;
  oprettetDato: string | null;
};

export type MondayMatchResultat = {
  hentetFraMonday: number;
  matchetTilStps: number;
  ingenMatch: number;
  ukendte: MondayKundeItem[];
};
