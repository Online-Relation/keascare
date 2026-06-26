// src/features/dashboard/types/salg.types.ts

export type SalgsSignal = {
  titel: string;
  observation: string;
  relevans: string;
  ydelse: string;
  salgspunkt: string;
};

export type SalgsAnbefalinger = {
  åbning: string;
  signaler: SalgsSignal[];
  tone: string;
  næsteSteg: string;
};
