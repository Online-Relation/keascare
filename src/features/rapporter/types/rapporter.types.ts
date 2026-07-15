// src/features/rapporter/types/rapporter.types.ts

export type FundNiveau = 'kritisk' | 'stoerre' | 'mindre' | 'ingen' | 'ukendt';

export type RapportRække = {
  id: string;
  navn: string;
  kommune: string | null;
  fundNiveau: FundNiveau;
  rapportDato: string | null;
  rapportLink: string | null;
  temaer: string[];
};

export type MånedligTrend = {
  måned: string;       // "jun 25"
  kritisk: number;
  kritiskLinje: number;
  mindre: number;
  ingen: number;
};

export type KommuneFundStat = {
  kommune: string;
  kritisk: number;
  mindre: number;
  total: number;
};

export type TemaStat = {
  tema: string;
  antal: number;
  pct: number;
};

export type MånedligKritisk = {
  måned: string;
  kritisk: number;
  kritiskLinje: number;
};

export type RapporterData = {
  kpis: {
    kritiske: number;
    mindreOgStørre: number;
    ingen: number;
    total: number;
    kritiskeSidste30: number;
    kritiskePct: number;
    totalIDatabase: number;
    kritiskePerMåned: number;
  };
  trend: MånedligTrend[];
  kritiskeMåneder: MånedligKritisk[];
  topKommuner: KommuneFundStat[];
  temaer: TemaStat[];
  rapporter: RapportRække[];
};
