'use client';

// src/features/systemstatus/components/SystemStatusPage/sections/ScraperCountdowns/ScraperCountdowns.tsx

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

type Kilde = 'railway' | 'cronjobs' | 'synology' | 'lokal' | 'manuel';

type ScraperInfo = {
  id: string;
  navn: string;
  kilde: Kilde;
  cronTidspunkt: string;
  logNøgler: string[]; // scraper-id'er fra logs API
  næsteKørsel: () => Date | null; // null = ingen automatisk kørsel
};

function næsteDagKl(time: number, minut = 0): Date {
  const nu = new Date();
  const næste = new Date();
  næste.setHours(time, minut, 0, 0);
  if (næste <= nu) næste.setDate(næste.getDate() + 1);
  return næste;
}

function næsteKvartal(): Date {
  const nu = new Date();
  const kvartalMåneder = [0, 3, 6, 9];
  for (const m of kvartalMåneder) {
    const kandidat = new Date(nu.getFullYear(), m, 5, 8, 0, 0);
    if (kandidat > nu) return kandidat;
  }
  return new Date(nu.getFullYear() + 1, 0, 5, 8, 0, 0);
}

const SCRAPER_GRUPPER: { gruppe: string; scrapers: ScraperInfo[] }[] = [
  {
    gruppe: 'STPS — Tilsynsrapporter',
    scrapers: [
      {
        id: 'stps-liste',
        navn: 'Hent nye rapporter',
        kilde: 'railway',
        cronTidspunkt: 'Dagligt kl. 20:00',
        logNøgler: ['stps-liste'],
        næsteKørsel: () => næsteDagKl(20),
      },
      {
        id: 'stps-detaljer',
        navn: "Parse PDF'er",
        kilde: 'railway',
        cronTidspunkt: 'Dagligt kl. 20:04',
        logNøgler: ['stps-detaljer'],
        næsteKørsel: () => næsteDagKl(20, 4),
      },
      {
        id: 'stps-fund-items',
        navn: 'Udtræk fund-items',
        kilde: 'railway',
        cronTidspunkt: 'Dagligt kl. 20:04',
        logNøgler: ['stps-fund-items'],
        næsteKørsel: () => næsteDagKl(20, 4),
      },
      {
        id: 'stps-pnummer',
        navn: 'Udtræk P-numre',
        kilde: 'railway',
        cronTidspunkt: 'Dagligt kl. 20:04',
        logNøgler: ['stps-pnummer'],
        næsteKørsel: () => næsteDagKl(20, 4),
      },
    ],
  },
  {
    gruppe: 'Tilbudsportalen',
    scrapers: [
      {
        id: 'tp-liste',
        navn: 'Hent tilbudsliste',
        kilde: 'synology',
        cronTidspunkt: 'Dagligt kl. 03:00',
        logNøgler: ['tp-liste'],
        næsteKørsel: () => næsteDagKl(3),
      },
      {
        id: 'tp-detaljer',
        navn: 'Hent detaljer',
        kilde: 'synology',
        cronTidspunkt: 'Dagligt kl. 03:00',
        logNøgler: ['tp-detaljer'],
        næsteKørsel: () => næsteDagKl(3),
      },
      {
        id: 'tp-match',
        navn: 'Kør matcher',
        kilde: 'cronjobs',
        cronTidspunkt: 'Dagligt kl. 05:00',
        logNøgler: ['tp-match'],
        næsteKørsel: () => næsteDagKl(5),
      },
    ],
  },
  {
    gruppe: 'CVR-register',
    scrapers: [
      {
        id: 'cvr-ansatte',
        navn: 'Opdater ansatte og virksomhedsdata',
        kilde: 'cronjobs',
        cronTidspunkt: 'Dagligt kl. 03:00',
        logNøgler: ['cvr-ansatte'],
        næsteKørsel: () => næsteDagKl(3),
      },
      {
        id: 'cvr-berig',
        navn: 'Berig med CVR og adresse',
        kilde: 'manuel',
        cronTidspunkt: 'Manuel',
        logNøgler: ['cvr-berig'],
        næsteKørsel: () => null,
      },
    ],
  },
  {
    gruppe: 'LOS & Monday',
    scrapers: [
      {
        id: 'monday-match',
        navn: 'Monday — Synkroniser kunder',
        kilde: 'manuel',
        cronTidspunkt: 'Manuel',
        logNøgler: ['monday-match', 'monday-sync'],
        næsteKørsel: () => null,
      },
      {
        id: 'los-liste',
        navn: 'LOS — Hent medlemsliste',
        kilde: 'railway',
        cronTidspunkt: 'Manuel',
        logNøgler: ['los-liste'],
        næsteKørsel: () => null,
      },
    ],
  },
  {
    gruppe: 'Geodata & Øvrige',
    scrapers: [
      {
        id: 'dst',
        navn: 'Danmarks Statistik — HAND01',
        kilde: 'cronjobs',
        cronTidspunkt: 'Kvartalsvist — 5. jan/apr/jul/okt',
        logNøgler: ['dst'],
        næsteKørsel: næsteKvartal,
      },
      {
        id: 'geocoder',
        navn: 'Geocoder — Koordinater via DAWA',
        kilde: 'manuel',
        cronTidspunkt: 'Manuel',
        logNøgler: ['geocoder'],
        næsteKørsel: () => null,
      },
    ],
  },
];

const KILDE_LABELS: Record<Kilde, string> = {
  railway:  'Railway',
  cronjobs: 'cronjobs.org',
  synology: 'Synology',
  lokal:    'Lokal',
  manuel:   'Manuel',
};

const KILDE_FARVE: Record<Kilde, { bg: string; color: string }> = {
  railway:  { bg: '#dbeafe', color: '#1e40af' },
  cronjobs: { bg: '#f3e8ff', color: '#6b21a8' },
  synology: { bg: '#fef3c7', color: '#92400e' },
  lokal:    { bg: '#f0fdf4', color: '#166534' },
  manuel:   { bg: 'var(--color-border-light)', color: 'var(--color-text-muted)' },
};

function formaterCountdown(ms: number): string {
  const timer = Math.floor(ms / 1000 / 60 / 60);
  const min = Math.floor((ms / 1000 / 60) % 60);
  if (timer >= 24) {
    const dage = Math.floor(timer / 24);
    return `${dage} dag${dage !== 1 ? 'e' : ''}`;
  }
  if (timer === 0) return `${min} min`;
  return `${timer}t ${min}m`;
}

type LogEntry = { scraperId: string; ok: boolean; kørtKl: string };

export function ScraperCountdowns() {
  const [nu, setNu] = useState(new Date());
  const [logs, setLogs] = useState<Record<string, LogEntry>>({});

  useEffect(() => {
    const iv = setInterval(() => setNu(new Date()), 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch('/api/scrapers/logs')
      .then((r) => r.json())
      .then((data: LogEntry[]) => {
        const map: Record<string, LogEntry> = {};
        for (const l of data) map[l.scraperId] = l;
        setLogs(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {SCRAPER_GRUPPER.map((grp) => (
        <div key={grp.gruppe}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            {grp.gruppe}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {grp.scrapers.map((s) => {
              const næste = s.næsteKørsel();
              const msHen = næste ? næste.getTime() - nu.getTime() : null;
              const seneste = s.logNøgler
                .map((k) => logs[k])
                .filter(Boolean)
                .sort((a, b) => new Date(b.kørtKl).getTime() - new Date(a.kørtKl).getTime())[0];

              const kildeStyle = KILDE_FARVE[s.kilde];

              return (
                <div key={s.id} className="dashboard-kort" style={{ padding: '0.875rem 1.125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text-primary)' }}>
                        {s.navn}
                      </span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 'var(--fw-semibold)', padding: '0.1rem 0.5rem', borderRadius: 9999, background: kildeStyle.bg, color: kildeStyle.color }}>
                        {KILDE_LABELS[s.kilde]}
                      </span>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {s.cronTidspunkt}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    {seneste && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: 'var(--text-xs)', color: seneste.ok ? 'var(--color-success, #16a34a)' : '#dc2626' }}>
                        {seneste.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        {new Date(seneste.kørtKl).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {msHen !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        <Clock size={12} />
                        om {formaterCountdown(msHen)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
