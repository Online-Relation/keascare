// src/features/monday/types/monday.types.ts

export type MondayGruppe = 'nye_forloeb' | 'aktive_forloeb' | 'afsluttet_forloeb' | 'tabt' | 'ukendt';

export type MondayKundeItem = {
  mondayId: string;
  navn: string;
  gruppe: MondayGruppe;
  gruppeNavn: string;
  cvr: string | null;
  adresse: string | null;
  email: string | null;
  website: string | null;
  oprettetDato: string | null;
  forløbsansvarlig: string | null;
  opfølgningsdato: string | null;
  afsluttetDato: string | null;
  status: string | null;
};

export type MondayMatchResultat = {
  hentetFraMonday: number;
  matchetTilStps: number;
  matchetTilTp: number;
  ingenMatch: number;
  ukendte: MondayKundeItem[];
};
