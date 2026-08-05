// src/features/stps/types/inspektoer.types.ts

import type { StpsFundNiveau } from './stps.types';

export type InspektoerRapport = {
  id: string;
  bostedNavn: string;
  dato: string | null;
  fundNiveau: StpsFundNiveau;
  temaer: string[];
  kommune: string | null;
  region: string | null;
  rapportUrl: string;
  pdfStorageUrl: string | null;
  tilsynsform: string | null;
};

export type InspektoerKollega = {
  navn: string;
  slug: string;
  titel: string | null;
  antalSammen: number;
};

export type InspektoerFuldStat = {
  navn: string;
  slug: string;
  titel: string | null;
  antal: number;
  bosteder: string[];
  kommuner: string[];
  antalMedFund: number;
  antalKritiske: number;
  mesteFund: { tema: string; antal: number }[];
  senesteDato: string | null;
  foersteDato: string | null;
  rapporter: InspektoerRapport[];
  kolleger: InspektoerKollega[];
};

export type InspektoerSortKey =
  | 'tilsyn'
  | 'bosteder'
  | 'kommuner'
  | 'seneste'
  | 'fund'
  | 'kritiske'
  | 'navn';
