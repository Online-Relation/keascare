// src/features/markedsforing/data/google.mock.ts

import type { DagligDatapunkt, KampagneRække, MetrikKortData, FordelingSegment } from '../types/markedsforing.types';

export const googleDagligData: DagligDatapunkt[] = [
  { dato: '27 maj', forbrug: 890,  leads: 6,  klik: 198, visninger: 4200 },
  { dato: '28 maj', forbrug: 720,  leads: 4,  klik: 155, visninger: 3600 },
  { dato: '29 maj', forbrug: 810,  leads: 5,  klik: 172, visninger: 3900 },
  { dato: '30 maj', forbrug: 540,  leads: 3,  klik: 118, visninger: 2800 },
  { dato: '31 maj', forbrug: 590,  leads: 4,  klik: 128, visninger: 3100 },
  { dato: '01 jun', forbrug: 980,  leads: 8,  klik: 210, visninger: 4800 },
  { dato: '02 jun', forbrug: 920,  leads: 7,  klik: 198, visninger: 4500 },
  { dato: '03 jun', forbrug: 1100, leads: 9,  klik: 240, visninger: 5200 },
  { dato: '04 jun', forbrug: 860,  leads: 6,  klik: 185, visninger: 4100 },
  { dato: '05 jun', forbrug: 620,  leads: 4,  klik: 138, visninger: 3200 },
  { dato: '06 jun', forbrug: 670,  leads: 5,  klik: 145, visninger: 3400 },
  { dato: '07 jun', forbrug: 1050, leads: 8,  klik: 228, visninger: 5000 },
  { dato: '08 jun', forbrug: 990,  leads: 7,  klik: 215, visninger: 4700 },
  { dato: '09 jun', forbrug: 1180, leads: 10, klik: 258, visninger: 5600 },
  { dato: '10 jun', forbrug: 1120, leads: 9,  klik: 244, visninger: 5300 },
  { dato: '11 jun', forbrug: 780,  leads: 6,  klik: 168, visninger: 3900 },
  { dato: '12 jun', forbrug: 740,  leads: 5,  klik: 160, visninger: 3700 },
  { dato: '13 jun', forbrug: 1070, leads: 8,  klik: 232, visninger: 5100 },
  { dato: '14 jun', forbrug: 1140, leads: 10, klik: 248, visninger: 5400 },
  { dato: '15 jun', forbrug: 1260, leads: 12, klik: 274, visninger: 6000 },
  { dato: '16 jun', forbrug: 1190, leads: 11, klik: 260, visninger: 5700 },
  { dato: '17 jun', forbrug: 850,  leads: 6,  klik: 182, visninger: 4200 },
  { dato: '18 jun', forbrug: 800,  leads: 5,  klik: 174, visninger: 3900 },
  { dato: '19 jun', forbrug: 1150, leads: 10, klik: 252, visninger: 5500 },
  { dato: '20 jun', forbrug: 1220, leads: 11, klik: 266, visninger: 5900 },
  { dato: '21 jun', forbrug: 1340, leads: 13, klik: 292, visninger: 6400 },
  { dato: '22 jun', forbrug: 1280, leads: 12, klik: 278, visninger: 6100 },
  { dato: '23 jun', forbrug: 910,  leads: 7,  klik: 196, visninger: 4500 },
  { dato: '24 jun', forbrug: 860,  leads: 6,  klik: 186, visninger: 4200 },
  { dato: '25 jun', forbrug: 1210, leads: 11, klik: 264, visninger: 5800 },
];

export const googleKampagner: KampagneRække[] = [
  { navn: 'Search – Botilbud keywords',     forbrug: 9800,  leads: 92,  klik: 3200, cpl: 107 },
  { navn: 'Search – Plejebolig Danmark',    forbrug: 6400,  leads: 54,  klik: 2100, cpl: 119 },
  { navn: 'Performance Max',               forbrug: 7200,  leads: 61,  klik: 2600, cpl: 118 },
  { navn: 'Display – Branche retargeting', forbrug: 3900,  leads: 24,  klik: 980,  cpl: 163 },
  { navn: 'YouTube – Awareness',            forbrug: 2700,  leads: 12,  klik: 520,  cpl: 225 },
];

export const googleFordeling: FordelingSegment[] = [
  { navn: 'Search',          værdi: 52, farve: '#4285F4' },
  { navn: 'Performance Max', værdi: 24, farve: '#34A853' },
  { navn: 'Display',         værdi: 13, farve: '#FBBC05' },
  { navn: 'YouTube',         værdi: 11, farve: '#EA4335' },
];

export const googleMetrikker: MetrikKortData[] = [
  {
    label: 'Månedligt forbrug',
    værdi: '30.000 kr.',
    underværdi: 'Budget: 32.000 kr.',
    tendens: 'neutral',
    tendensProc: '−6%',
    forklaring: 'Samlet forbrug på Google Ads denne måned fordelt på Search, Display og YouTube.',
  },
  {
    label: 'Konverteringer',
    værdi: '243',
    underværdi: 'vs. 208 sidst mdr.',
    tendens: 'op',
    tendensProc: '+17%',
    forklaring: 'En konvertering sker, når en bruger udfører en ønsket handling, fx sender en kontaktformular eller ringer til jer.',
  },
  {
    label: 'Cost per konvertering',
    værdi: '123 kr.',
    underværdi: 'vs. 139 kr. sidst mdr.',
    tendens: 'op',
    tendensProc: '−11%',
    forklaring: 'Gennemsnitlig pris pr. konvertering. Google Search-annoncer giver typisk lavere CPC end Meta, fordi folk aktivt søger.',
  },
  {
    label: 'Klik',
    værdi: '6.310',
    underværdi: '4,8% CTR',
    tendens: 'op',
    tendensProc: '+9%',
    forklaring: 'Antal klik på dine Google-annoncer. CTR over 4% er stærkt for søgeannoncer og betyder, at annoncen er relevant.',
  },
  {
    label: 'Gns. Quality Score',
    værdi: '7,4 / 10',
    underværdi: 'Godt niveau',
    tendens: 'op',
    tendensProc: '+0,3',
    forklaring: 'Google giver alle søgeord en kvalitetsscore fra 1-10. Høj score = lavere klik-pris. Over 7 er godt.',
  },
];
