// src/features/tidsregistrering/types/tidsregistrering.types.ts

export type Periode = 'denne-uge' | 'sidste-uge' | 'denne-maaned' | 'sidste-maaned' | 'dette-aar';

export type KategoriFordeling = {
  kategoriId: string;
  kategoriNavn: string;
  minutter: number;
  procentAndel: number;
  farve: string;
};

export type DagligData = {
  dato: string;
  label: string;
  minutter: number;
  antalRegistreringer: number;
};

export type TopOpgave = {
  navn: string;
  kategoriNavn: string;
  minutter: number;
  procentAndel: number;
};

export type DashboardData = {
  totalMinutter: number;
  antalRegistreringer: number;
  antalArbejdsdage: number;
  gennemsnitPrDagMin: number;
  forrigeTotal: number;
  fordeling: KategoriFordeling[];
  dagligData: DagligData[];
  topOpgaver: TopOpgave[];
  seneste: Tidsregistrering[];
};

export type TidsregistreringKategori = {
  id: string;
  navn: string;
  aktiv: boolean;
  oprettet: string;
};

export type TidsregistreringUnderpunkt = {
  id: string;
  kategoriId: string;
  navn: string;
  aktiv: boolean;
  oprettet: string;
};

export type Tidsregistrering = {
  id: string;
  brugerId: string;
  kategoriId: string;
  kategoriNavn: string;
  underpunktId: string | null;
  underpunktNavn: string | null;
  startTid: string;
  slutTid: string | null;
  varighedMinutter: number | null;
  note: string | null;
  oprettet: string;
};
