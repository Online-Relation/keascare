// src/features/markedsdata/types/markedsdata.types.ts

export type MarkedsdataBosted = {
  id: string;
  navn: string;
  kommune: string | null;
  fundNiveau: string | null;
  rapportDato: string | null;
  erKunde: boolean;
  losMedlem: boolean | null;
};

export type KommuneMarked = {
  kommune: string;
  antalBosteder: number;
  antalKunder: number;
  antalUrørt: number;
  antalLos: number;
  antalKritiske: number;
  borgere: number; // fra DST
};

export type OpmærksomhedSignal = {
  type: 'nye_fund' | 'opfoelgning' | 'ingen_kunder' | 'ikke_kontaktet';
  label: string;
  beskrivelse: string;
  antal: number;
};

export type MarkedsdataStats = {
  totalBosteder: number;
  antalKunder: number;
  antalKritiskeEllerStoerre: number;
  antalAldrigKontaktet: number;
  kommunerMedData: number;
  bosteder: MarkedsdataBosted[];
  kommuner: KommuneMarked[];
  opmærksomhedssignaler: OpmærksomhedSignal[];
};
