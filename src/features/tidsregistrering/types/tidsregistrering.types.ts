// src/features/tidsregistrering/types/tidsregistrering.types.ts

export type TidsregistreringKategori = {
  id: string;
  navn: string;
  aktiv: boolean;
  oprettet: string;
};

export type Tidsregistrering = {
  id: string;
  brugerId: string;
  kategoriId: string;
  kategoriNavn: string;
  startTid: string;
  slutTid: string | null;
  varighedMinutter: number | null;
  note: string | null;
  oprettet: string;
};
