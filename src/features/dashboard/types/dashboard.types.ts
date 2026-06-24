// src/features/dashboard/types/dashboard.types.ts

export type StpsFundNiveau = 'kritisk' | 'større' | 'mindre' | 'ingen' | 'ukendt';

export type DriftType = 'Privat' | 'Kommunal' | 'Regional';

export type Bosted = {
  id: string;
  navn: string;
  kommune: string;
  pladser: number;
  drift: DriftType;
  stpsFund: StpsFundNiveau;
  rapportDato: string;
  rapportFokus: string;
  rapportLink: string;
  erNy: boolean;
};

export type KpiItem = {
  id: string;
  label: string;
  value: string;
  sub: string;
  trend?: string;
  trendPositive?: boolean;
};

export type StpsFordeling = {
  label: string;
  antal: number;
  pct: number;
};

export type KommuneStat = {
  navn: string;
  antal: number;
  medFund: number;
};

export type TilbudsportalenStats = {
  total: number;
  nyeSidst: number;
  dækningsgrad: string;
  sidstOpdateret: string;
};

export type DashboardData = {
  kpis: KpiItem[];
  bosteder: Bosted[];
  tilbudsportalen: TilbudsportalenStats;
  stpsFordeling: StpsFordeling[];
  topKommuner: KommuneStat[];
};
