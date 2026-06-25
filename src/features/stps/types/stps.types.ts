// src/features/stps/types/stps.types.ts

export type StpsFundNiveau = 'kritisk' | 'stoerre' | 'mindre' | 'ingen' | 'ukendt';

export type StpsListeItem = {
  navn: string;
  rapportDato: string;
  tags: string[];
  detailUrl: string;
  besoegsDato: string | null;
};

export type StpsDetailItem = {
  navn: string;
  rapportDato: string;
  besoegsDato: string | null;
  tags: string[];
  pdfUrl: string | null;
  sanktioner: string[];
  fokusOmraader: string[];
  kommune: string | null;
  region: string | null;
  tilsynsform: string | null;
  temaer: string[];
};

export type StpsRapportInput = {
  stps_tilbud_navn: string;
  rapport_titel: string;
  rapport_dato: string | null;
  rapport_url: string;
  pdf_url: string | null;
  stps_konklusion: string | null;
  fund_niveau: StpsFundNiveau;
  fokus_omraader: string[];
  raa_tekst: string | null;
  kommune: string | null;
  region: string | null;
  tilsynsform: string | null;
  temaer: string[];
};

export type StpsScraperOptions = {
  maxSider?: number;
  parsePdf?: boolean;
  kunNyere?: number; // antal dage tilbage vi scraper
};

export type StpsScraperResultat = {
  fundet: number;
  nye: number;
  fejl: string[];
};
