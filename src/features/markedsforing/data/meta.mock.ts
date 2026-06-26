// src/features/markedsforing/data/meta.mock.ts

import type { DagligDatapunkt, KampagneRække, MetrikKortData, FordelingSegment } from '../types/markedsforing.types';

export const metaDagligData: DagligDatapunkt[] = [
  { dato: '27 maj', forbrug: 1240, leads: 8,  klik: 142, visninger: 9800 },
  { dato: '28 maj', forbrug: 980,  leads: 5,  klik: 98,  visninger: 7200 },
  { dato: '29 maj', forbrug: 1100, leads: 9,  klik: 120, visninger: 8500 },
  { dato: '30 maj', forbrug: 760,  leads: 4,  klik: 85,  visninger: 6100 },
  { dato: '31 maj', forbrug: 840,  leads: 6,  klik: 91,  visninger: 6800 },
  { dato: '01 jun', forbrug: 1380, leads: 12, klik: 178, visninger: 11200 },
  { dato: '02 jun', forbrug: 1290, leads: 11, klik: 164, visninger: 10400 },
  { dato: '03 jun', forbrug: 1520, leads: 14, klik: 195, visninger: 12600 },
  { dato: '04 jun', forbrug: 1190, leads: 9,  klik: 148, visninger: 9900 },
  { dato: '05 jun', forbrug: 870,  leads: 6,  klik: 105, visninger: 7300 },
  { dato: '06 jun', forbrug: 920,  leads: 7,  klik: 112, visninger: 7800 },
  { dato: '07 jun', forbrug: 1450, leads: 13, klik: 183, visninger: 11800 },
  { dato: '08 jun', forbrug: 1380, leads: 11, klik: 170, visninger: 10900 },
  { dato: '09 jun', forbrug: 1620, leads: 16, klik: 210, visninger: 13400 },
  { dato: '10 jun', forbrug: 1540, leads: 15, klik: 199, visninger: 12800 },
  { dato: '11 jun', forbrug: 1090, leads: 8,  klik: 135, visninger: 9200 },
  { dato: '12 jun', forbrug: 1030, leads: 7,  klik: 128, visninger: 8800 },
  { dato: '13 jun', forbrug: 1480, leads: 14, klik: 188, visninger: 12100 },
  { dato: '14 jun', forbrug: 1560, leads: 17, klik: 204, visninger: 13000 },
  { dato: '15 jun', forbrug: 1710, leads: 19, klik: 228, visninger: 14500 },
  { dato: '16 jun', forbrug: 1640, leads: 18, klik: 216, visninger: 13800 },
  { dato: '17 jun', forbrug: 1180, leads: 9,  klik: 145, visninger: 9600 },
  { dato: '18 jun', forbrug: 1120, leads: 8,  klik: 138, visninger: 9100 },
  { dato: '19 jun', forbrug: 1590, leads: 16, klik: 207, visninger: 13200 },
  { dato: '20 jun', forbrug: 1670, leads: 18, klik: 219, visninger: 13900 },
  { dato: '21 jun', forbrug: 1820, leads: 21, klik: 241, visninger: 15200 },
  { dato: '22 jun', forbrug: 1750, leads: 20, klik: 233, visninger: 14600 },
  { dato: '23 jun', forbrug: 1260, leads: 11, klik: 158, visninger: 10500 },
  { dato: '24 jun', forbrug: 1190, leads: 10, klik: 149, visninger: 9800 },
  { dato: '25 jun', forbrug: 1680, leads: 19, klik: 222, visninger: 14100 },
];

export const metaKampagner: KampagneRække[] = [
  { navn: 'Botilbud §107 – Retargeting',      forbrug: 8240,  leads: 68,  klik: 1240, cpl: 121 },
  { navn: 'Interesse – Plejesektoren',         forbrug: 11500, leads: 82,  klik: 1890, cpl: 140 },
  { navn: 'Lookalike – Eksist. kunder',        forbrug: 9100,  leads: 94,  klik: 1560, cpl: 97  },
  { navn: 'Geografi – Stor-København',         forbrug: 6800,  leads: 41,  klik: 980,  cpl: 166 },
  { navn: 'Adfærd – Beslutningstagere',        forbrug: 4560,  leads: 29,  klik: 640,  cpl: 157 },
];

export const metaFordeling: FordelingSegment[] = [
  { navn: 'Facebook',  værdi: 62, farve: '#1877F2' },
  { navn: 'Instagram', værdi: 38, farve: '#E1306C' },
];

export const metaMetrikker: MetrikKortData[] = [
  {
    label: 'Månedligt forbrug',
    værdi: '40.200 kr.',
    underværdi: 'Budget: 45.000 kr.',
    tendens: 'neutral',
    tendensProc: '−11%',
    forklaring: 'Hvor mange kroner der er brugt på Meta-annoncer denne måned. Sammenlignet med dit satte budget.',
  },
  {
    label: 'Leads',
    værdi: '314',
    underværdi: 'vs. 271 sidst mdr.',
    tendens: 'op',
    tendensProc: '+16%',
    forklaring: 'Antal potentielle kunder der har udfyldt en formular eller klikket på "Kontakt os" via dine annoncer.',
  },
  {
    label: 'Cost per lead',
    værdi: '128 kr.',
    underværdi: 'vs. 142 kr. sidst mdr.',
    tendens: 'op',
    tendensProc: '−10%',
    forklaring: 'Hvad det i gennemsnit koster at få ét lead. Jo lavere, desto bedre. Under 150 kr. er godt i denne branche.',
  },
  {
    label: 'Klik',
    værdi: '4.800',
    underværdi: '3,2% CTR',
    tendens: 'op',
    tendensProc: '+8%',
    forklaring: 'Antal gange nogen har klikket på dine annoncer. CTR (Click-Through Rate) viser hvor mange procent der klikker, når de ser annoncen.',
  },
  {
    label: 'Visninger',
    værdi: '312.000',
    underværdi: 'Reach: 98.400',
    tendens: 'op',
    tendensProc: '+12%',
    forklaring: 'Antal gange dine annoncer er blevet vist. "Reach" viser hvor mange unikke personer der har set dem (én person kan se annoncen flere gange).',
  },
];
