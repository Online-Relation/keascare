// src/features/dashboard/types/dashboard.types.ts

export type StpsFundNiveau = 'kritisk' | 'stoerre' | 'mindre' | 'ingen' | 'ukendt';

export type FundStatus = 'opfyldt' | 'ikke_opfyldt' | 'ikke_aktuelt' | 'ukendt';

export type FundItem = {
  sektion: string;
  nummer: number;
  målepunkt: string;
  status: FundStatus;
  kommentar: string | null;
};

export type Bosted = {
  id: string;
  navn: string;
  kommune: string | null;
  region: string | null;
  tilsynsform: string | null;
  temaer: string[];
  stpsFund: StpsFundNiveau;
  rapportDato: string | null;
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

export type BostedDetail = {
  id: string;
  navn: string;
  rapportTitel: string;
  rapportDato: string | null;
  rapportUrl: string;
  pdfUrl: string | null;
  stpsKonklusion: string | null;
  fundNiveau: StpsFundNiveau;
  fokusOmraader: string[];
  kommune: string | null;
  region: string | null;
  tilsynsform: string | null;
  temaer: string[];
  scraperDato: string | null;
  // PDF-berigede felter
  pdfVurdering: string | null;
  pdfFund: string | null;
  adresse: string | null;
  pladser: string | null;
  cvr: string | null;
  pdfBehandlet: boolean;
  // Tilbudsportalen-berigede felter
  tpTilbudstype: string | null;
  tpPladser: string | null;
  tpPNummer: string | null;
  tpKommune: string | null;
  tpKontaktperson: string | null;
  tpTelefon: string | null;
  tpEmail: string | null;
  tpAdresse: string | null;
  tpLeder: string | null;
  tpWebsite: string | null;
  tpVirksomhedsNavn: string | null;
  tpTilsynsmyndighed: string | null;
  tpPladsePrParagraf: string | null;
  fundItems: FundItem[] | null;
};

export type DashboardData = {
  kpis: KpiItem[];
  bosteder: Bosted[];
  tilbudsportalen: TilbudsportalenStats;
  stpsFordeling: StpsFordeling[];
  topKommuner: KommuneStat[];
};
