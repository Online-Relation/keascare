// src/features/medarbejdere/types/medarbejdere.types.ts

export type Medarbejder = {
  id: string;
  navn: string;
  stillingsbetegnelse: string | null;
  telefon: string | null;
  email: string | null;
  brugerId: string | null;
  brugerEmail: string | null;
  aktiv: boolean;
  oprettet: string;
};

export type MedarbejderInput = {
  navn: string;
  stillingsbetegnelse?: string | null;
  telefon?: string | null;
  email?: string | null;
  brugerId?: string | null;
};
