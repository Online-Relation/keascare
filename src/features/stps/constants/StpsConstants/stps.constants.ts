// src/features/stps/constants/StpsConstants/stps.constants.ts

export const STPS_BASE_URL = 'https://stps.dk';

export const STPS_LISTING_URL =
  'https://stps.dk/sundhedsfaglig/tilsyn/tilsynsrapporter';

export const STPS_HTTP_CONFIG = {
  headers: {
    'User-Agent': 'KeasCare-Scraper/1.0 (keascare.dk – kontakt: mads@onlinerelation.dk)',
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'da-DK,da;q=0.9',
  },
  timeout: 15_000,
} as const;

// Forsinkelse mellem HTTP-requests – respekterer STPS's servere
export const SCRAPER_DELAY_MS = 100;

// Maks PDF-størrelse vi downloader (15 MB)
export const MAX_PDF_BYTES = 15 * 1024 * 1024;

// Maks tegn vi gemmer af rå PDF-tekst i Supabase
export const MAX_RAA_TEKST_LAENGDE = 50_000;

// Sanktioner STPS bruger – lavere index = lavere alvorlighed
export const STPS_SANKTIONER = ['henstilling', 'indskærpelse', 'påbud'] as const;

// Tags vi klassificerer som tilsynstype (ekskluderes fra fokus_omraader)
export const STPS_TYPE_TAGS = new Set([
  'tilsynsrapport',
  'tilsyn',
  'planlagt tilsyn',
  'uanmeldt tilsyn',
  'reaktivt tilsyn',
  'tematilsyn',
  'opfølgende tilsyn',
]);

// Kendte tilsynsformer
export const STPS_TILSYNSFORMER = new Set([
  'planlagt tilsyn',
  'reaktivt tilsyn',
  'uanmeldt tilsyn',
  'tematilsyn',
  'opfølgende tilsyn',
]);

// Kendte temaer fra STPS filter
export const STPS_TEMAER = new Set([
  'behandling med insulin',
  'blodfortyndende medicin',
  'børne- og ungdomspsykiatri',
  'demens og antipsykotika',
  'medicinhåndtering',
  'opstartstilsyn',
  'ortopædkirurgisk patientforløb',
  'teleKOL',
  'voksenpsykiatri',
  'ældretilsynet',
]);

// Kendte regioner – bruges til at skelne geo-tags fra fokus-tags
export const STPS_REGIONER = new Set([
  'hovedstaden',
  'sjælland',
  'syddanmark',
  'midtjylland',
  'nordjylland',
]);
