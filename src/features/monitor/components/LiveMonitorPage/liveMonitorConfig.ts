// src/features/monitor/components/LiveMonitorPage/liveMonitorConfig.ts

import type { ScraperLogHistorik } from '@/lib/db/ScraperLog';

export type ScraperDef = {
  id: string;
  label: string;
  kørselKl: string;
  intervalTimer: number;
};

export const SCRAPER_GRUPPER: { label: string; scrapers: ScraperDef[] }[] = [
  {
    label: 'STPS Kæde',
    scrapers: [
      { id: 'stps-liste',      label: 'STPS Rapporter', kørselKl: '20:00', intervalTimer: 24 },
      { id: 'stps-detaljer',   label: 'STPS PDFer',     kørselKl: '21:00', intervalTimer: 24 },
      { id: 'stps-fund-items', label: 'STPS Fund',      kørselKl: '22:00', intervalTimer: 24 },
      { id: 'stps-pnummer',    label: 'P-numre',        kørselKl: '23:00', intervalTimer: 24 },
    ],
  },
  {
    label: 'CVR & Regnskab',
    scrapers: [
      { id: 'cvr-berig',   label: 'CVR Opslag',  kørselKl: '00:00', intervalTimer: 24 },
      { id: 'cvr-ansatte', label: 'CVR Ansatte', kørselKl: '03:00', intervalTimer: 24 },
      { id: 'regnskab',    label: 'Regnskab',    kørselKl: '03:00', intervalTimer: 24 },
    ],
  },
  {
    label: 'Tilbudsportalen',
    scrapers: [
      { id: 'tp-liste',    label: 'TP Liste',    kørselKl: '03:00', intervalTimer: 24 },
      { id: 'tp-detaljer', label: 'TP Detaljer', kørselKl: '03:00', intervalTimer: 24 },
    ],
  },
  {
    label: 'Afslutning',
    scrapers: [
      { id: 'monday-sync', label: 'Monday Sync', kørselKl: '04:00', intervalTimer: 24 },
      { id: 'tp-match',    label: 'TP Matcher',  kørselKl: '05:00', intervalTimer: 24 },
    ],
  },
];

export const SCRAPERS: ScraperDef[] = SCRAPER_GRUPPER.flatMap((g) => g.scrapers);

export type Status = 'ok' | 'advarsel' | 'fejl' | 'ukendt' | 'kører';

export const PALETTE: Record<Status, { accent: string; dim: string; badge: string; badgeTekst: string; label: string }> = {
  ok:      { accent: '#22c55e', dim: '#22c55e33', badge: '#052e16', badgeTekst: '#4ade80',  label: 'OK' },
  advarsel:{ accent: '#f59e0b', dim: '#f59e0b33', badge: '#1c1408', badgeTekst: '#fcd34d',  label: 'FORSINKET' },
  fejl:    { accent: '#ef4444', dim: '#ef444433', badge: '#450a0a', badgeTekst: '#fca5a5',  label: 'FEJL' },
  ukendt:  { accent: '#334155', dim: '#33415511', badge: '#0f172a', badgeTekst: '#475569',  label: 'AFVENTER' },
  kører:   { accent: '#38bdf8', dim: '#38bdf833', badge: '#0c1a2e', badgeTekst: '#7dd3fc',  label: 'LIVE' },
};

export function getStatus(log: ScraperLogHistorik | undefined, intervalTimer: number): Status {
  if (!log) return 'ukendt';
  if (!log.ok) return 'fejl';
  const timerSiden = (Date.now() - new Date(log.kørtKl).getTime()) / 3_600_000;
  if (timerSiden > intervalTimer * 1.5) return 'advarsel';
  return 'ok';
}

export function getBehandlet(log: ScraperLogHistorik): number {
  return typeof log.resultat?.behandlet === 'number' ? log.resultat.behandlet : 0;
}

export function tidLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
}

export function tidSidenLabel(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1)  return 'lige nu';
  if (min < 60) return `${min}m siden`;
  const t = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${t}t ${m}m` : `${t}t`;
}

export function estimerRestTid(startetKl: string, progress: number, total: number): string {
  if (progress <= 0 || total <= 0) return '...';
  const forbrugtMs = Date.now() - new Date(startetKl).getTime();
  const msPerEnhed = forbrugtMs / progress;
  const restMs = msPerEnhed * (total - progress);
  const min = Math.round(restMs / 60_000);
  if (min < 1) return 'snart færdig';
  if (min < 60) return `~${min} min`;
  const t = Math.floor(min / 60);
  const m = min % 60;
  return `~${t}t ${m > 0 ? ` ${m}m` : ''}`;
}
