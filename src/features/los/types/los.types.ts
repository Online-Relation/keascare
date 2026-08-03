// src/features/los/types/los.types.ts

export type LosMedlem = {
  id?: string;
  los_id: string;
  navn: string;
  url: string;
  cvr: string | null;
  telefon: string | null;
  email: string | null;
  website: string | null;
  adresse: string | null;
  region: string | null;
  kommune: string | null;
  tilbudstyper: string[];

  // Ydelser og målgrupper
  los_tilbud: string[];
  los_tillaegsydelser: string[];
  los_maalgrupper: string[];
  los_diagnoser: string[];
  los_aldersgrupper: string[];
  los_obs_alder: string | null;

  // Faglig tilgang
  los_faglig_tilgang: string | null;

  // Pladser
  los_pladser: number | null;

  // Priser og opsigelse
  los_dagstakst: string | null;
  los_andre_tilbud_pris: string | null;
  los_opsigelsesvarsel: string | null;

  // Ledelse og personale
  los_leder: string | null;
  los_ansatte: number | null;
  los_fuldtidsstillinger: number | null;
  los_organisationstype: string | null;
  los_oprettelsesaar: number | null;

  scraper_dato: string;
};

export type LosListeItem = {
  los_id: string;
  navn: string;
  url: string;
  tilbudstyper: string[];
};

export type LosScraperResultat = {
  hentet: number;
  detaljer: number;
  fejl: string[];
};
