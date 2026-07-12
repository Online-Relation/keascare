// src/features/dashboard/types/dashboard.types.ts
import type { SalgsAnbefalinger } from './salg.types';

export type StpsFundNiveau = 'kritisk' | 'stoerre' | 'mindre' | 'ingen' | 'ukendt';

export type FundStatus = 'opfyldt' | 'ikke_opfyldt' | 'ikke_aktuelt' | 'ukendt';

export type FundItem = {
  sektion: string;
  nummer: number;
  målepunkt: string;
  status: FundStatus;
  kommentar: string | null;
};

export type DataKvalitet = {
  score: number;
  max: number;
};

export type MondayKundeStatus = 'kunde' | 'ingen';

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
  dataKvalitet: DataKvalitet;
  mondayKunde: MondayKundeStatus;
  mondayGruppe: string | null;
  mondayItemId: string | null;
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

export type KommuneFundNiveau = 'kritisk' | 'mindre' | 'ingen';

export type KommuneStat = {
  navn: string;
  antal: number;
  medFund: number;
  højesteFund: KommuneFundNiveau;
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
  besoegDato: string | null;
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
  cvrAntalAfdelinger: number | null;
  // CVR-berigede felter (opdateres dagligt)
  cvrAnsatte: number | null;
  cvrBranche: string | null;
  cvrVirksomhedstype: string | null;
  cvrStiftet: string | null;
  cvrOpdateret: string | null;
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
  dataKvalitet: DataKvalitet;
  fundItems: FundItem[] | null;
  salgsAnbefalinger: SalgsAnbefalinger | null;
  mondayKunde: MondayKundeStatus;
  mondayGruppe: string | null;
  mondayItemId: string | null;
  regnskabAar: number | null;
  regnskabNettoomsaetning: number | null;
  regnskabBruttofortjeneste: number | null;
  regnskabAarsresultat: number | null;
  regnskabEgenkapital: number | null;
  regnskabBalance: number | null;
  regnskabOpdateret: string | null;
};

export type SalgsFunnelTrin = {
  label: string;
  antal: number;
  beskrivelse: string;
};

export type SalgsFunnel = {
  trin: SalgsFunnelTrin[];
};

export type DatakildeStatus = 'aktiv' | 'ikke_implementeret' | 'fejl';

export type Datakilde = {
  navn: string;
  status: DatakildeStatus;
  sidstOpdateret: string | null;
  note: string | null;
};

export type DashboardData = {
  kpis: KpiItem[];
  bosteder: Bosted[];
  cvrSignaler: import('@/features/cvr/types/cvr.types').CvrSignal[];
  tilbudsportalen: TilbudsportalenStats;
  stpsFordeling: StpsFordeling[];
  topKommuner: KommuneStat[];
  salgsFunnel: SalgsFunnel;
  datakilder: Datakilde[];
};
