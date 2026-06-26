// src/features/markedsforing/data/linkedin.mock.ts

import type { DagligDatapunkt, KampagneRække, MetrikKortData, FordelingSegment } from '../types/markedsforing.types';

export const linkedinDagligData: DagligDatapunkt[] = [
  { dato: '27 maj', forbrug: 420,  leads: 2, klik: 48,  visninger: 1800 },
  { dato: '28 maj', forbrug: 380,  leads: 1, klik: 41,  visninger: 1600 },
  { dato: '29 maj', forbrug: 410,  leads: 2, klik: 46,  visninger: 1750 },
  { dato: '30 maj', forbrug: 290,  leads: 1, klik: 32,  visninger: 1200 },
  { dato: '31 maj', forbrug: 310,  leads: 1, klik: 35,  visninger: 1300 },
  { dato: '01 jun', forbrug: 480,  leads: 3, klik: 54,  visninger: 2100 },
  { dato: '02 jun', forbrug: 460,  leads: 3, klik: 52,  visninger: 2000 },
  { dato: '03 jun', forbrug: 540,  leads: 4, klik: 61,  visninger: 2400 },
  { dato: '04 jun', forbrug: 430,  leads: 3, klik: 49,  visninger: 1900 },
  { dato: '05 jun', forbrug: 320,  leads: 2, klik: 36,  visninger: 1400 },
  { dato: '06 jun', forbrug: 340,  leads: 2, klik: 38,  visninger: 1500 },
  { dato: '07 jun', forbrug: 510,  leads: 4, klik: 58,  visninger: 2200 },
  { dato: '08 jun', forbrug: 490,  leads: 3, klik: 55,  visninger: 2100 },
  { dato: '09 jun', forbrug: 580,  leads: 5, klik: 66,  visninger: 2600 },
  { dato: '10 jun', forbrug: 550,  leads: 4, klik: 62,  visninger: 2450 },
  { dato: '11 jun', forbrug: 390,  leads: 2, klik: 44,  visninger: 1700 },
  { dato: '12 jun', forbrug: 360,  leads: 2, klik: 41,  visninger: 1580 },
  { dato: '13 jun', forbrug: 520,  leads: 4, klik: 59,  visninger: 2250 },
  { dato: '14 jun', forbrug: 560,  leads: 5, klik: 63,  visninger: 2400 },
  { dato: '15 jun', forbrug: 620,  leads: 6, klik: 71,  visninger: 2800 },
  { dato: '16 jun', forbrug: 590,  leads: 5, klik: 67,  visninger: 2650 },
  { dato: '17 jun', forbrug: 420,  leads: 3, klik: 48,  visninger: 1850 },
  { dato: '18 jun', forbrug: 400,  leads: 2, klik: 45,  visninger: 1750 },
  { dato: '19 jun', forbrug: 570,  leads: 5, klik: 65,  visninger: 2500 },
  { dato: '20 jun', forbrug: 600,  leads: 5, klik: 68,  visninger: 2700 },
  { dato: '21 jun', forbrug: 660,  leads: 7, klik: 76,  visninger: 3000 },
  { dato: '22 jun', forbrug: 630,  leads: 6, klik: 72,  visninger: 2850 },
  { dato: '23 jun', forbrug: 450,  leads: 3, klik: 51,  visninger: 2000 },
  { dato: '24 jun', forbrug: 430,  leads: 3, klik: 49,  visninger: 1900 },
  { dato: '25 jun', forbrug: 640,  leads: 6, klik: 73,  visninger: 2900 },
];

export const linkedinKampagner: KampagneRække[] = [
  { navn: 'Social & Sundhed – Ledere',    forbrug: 5800, leads: 38, klik: 620, cpl: 153 },
  { navn: 'HR-chefer – Plejesektor',      forbrug: 4200, leads: 24, klik: 445, cpl: 175 },
  { navn: 'Plejechef – 200-500 ansatte',  forbrug: 3100, leads: 19, klik: 328, cpl: 163 },
  { navn: 'Thought Leadership – Content', forbrug: 1900, leads: 8,  klik: 198, cpl: 238 },
];

export const linkedinFordeling: FordelingSegment[] = [
  { navn: '50-200 ansatte',  værdi: 34, farve: '#0A66C2' },
  { navn: '201-500 ansatte', værdi: 41, farve: '#0D8A6A' },
  { navn: '500+ ansatte',    værdi: 25, farve: '#5C7CFA' },
];

export const linkedinMetrikker: MetrikKortData[] = [
  {
    label: 'Månedligt forbrug',
    værdi: '15.000 kr.',
    underværdi: 'Budget: 16.000 kr.',
    tendens: 'neutral',
    tendensProc: '−6%',
    forklaring: 'Samlet forbrug på LinkedIn Ads. LinkedIn er dyrere end Meta, men rammer præcist de rigtige beslutningstagere i din branche.',
  },
  {
    label: 'Leads',
    værdi: '89',
    underværdi: 'vs. 71 sidst mdr.',
    tendens: 'op',
    tendensProc: '+25%',
    forklaring: 'Antal leads genereret via LinkedIn. Et LinkedIn-lead er typisk af højere kvalitet, da du rammer professionelle i branchen.',
  },
  {
    label: 'Cost per lead',
    værdi: '169 kr.',
    underværdi: 'vs. 198 kr. sidst mdr.',
    tendens: 'op',
    tendensProc: '−15%',
    forklaring: 'LinkedIn CPL er naturligt højere end Meta og Google, men leadkvaliteten er bedre. Under 200 kr. er stærkt for B2B i plejesektoren.',
  },
  {
    label: 'Engagement rate',
    værdi: '3,8%',
    underværdi: 'Likes · Kommentarer · Delinger',
    tendens: 'op',
    tendensProc: '+0,6%',
    forklaring: 'Procentdel der interagerer med dit indhold. Over 2% er godt på LinkedIn. Høj engagement øger organisk rækkevidde uden ekstra cost.',
  },
  {
    label: 'Reach',
    værdi: '62.400',
    underværdi: '2.080 pr. dag i snit',
    tendens: 'op',
    tendensProc: '+18%',
    forklaring: 'Antal unikke professionelle der har set dine annoncer på LinkedIn denne måned.',
  },
];
