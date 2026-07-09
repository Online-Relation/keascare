'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

type ScraperInfo = {
  id: string;
  navn: string;
  beskrivelse: string;
  næsteKørsel: () => Date;
  kilde: 'railway' | 'lokal';
};

function næsteDagKl(time: number, minut: number): Date {
  const nu = new Date();
  const næste = new Date();
  næste.setHours(time, minut, 0, 0);
  if (næste <= nu) næste.setDate(næste.getDate() + 1);
  return næste;
}

function næsteMandag(time: number, minut: number): Date {
  const nu = new Date();
  const næste = new Date();
  const dagIUgen = næste.getDay(); // 0=søn, 1=man
  const dageHen = dagIUgen === 1 && næste.getHours() < time ? 0 : (8 - dagIUgen) % 7 || 7;
  næste.setDate(næste.getDate() + dageHen);
  næste.setHours(time, minut, 0, 0);
  return næste;
}

const SCRAPERS: ScraperInfo[] = [
  {
    id: 'stps',
    navn: 'STPS — Hent nye rapporter',
    beskrivelse: 'Kører automatisk hver nat og henter nye tilsynsrapporter fra stps.dk.',
    næsteKørsel: () => næsteDagKl(3, 0),
    kilde: 'railway',
  },
  {
    id: 'cvr',
    navn: 'CVR — Opdater virksomhedsdata',
    beskrivelse: 'Opdaterer ansatte, branche og CVR-data for alle bosteder.',
    næsteKørsel: () => næsteDagKl(3, 0),
    kilde: 'railway',
  },
  {
    id: 'regnskab',
    navn: 'Regnskab — Hent årsregnskab',
    beskrivelse: 'Henter nøgletal fra Erhvervsstyrelsens årsrapport-API for bosteder med CVR. Kræver ingen credentials.',
    næsteKørsel: () => næsteDagKl(4, 0),
    kilde: 'railway',
  },
  {
    id: 'monday-sync',
    navn: 'Monday — Synkroniser kunder',
    beskrivelse: 'Henter alle Monday-kunder og cacher dem i Supabase så Kunder-siden loader hurtigt.',
    næsteKørsel: () => {
      const nu = new Date();
      const næste = new Date(nu);
      næste.setMinutes(0, 0, 0);
      næste.setHours(næste.getHours() + 1);
      return næste;
    },
    kilde: 'railway',
  },
  {
    id: 'tp',
    navn: 'Tilbudsportalen — Fuld kørsel',
    beskrivelse: 'Kører lokalt hver mandag kl. 11:00 og henter detaljer fra Tilbudsportalen.',
    næsteKørsel: () => næsteMandag(11, 0),
    kilde: 'lokal',
  },
];

function formaterCountdown(ms: number): string {
  const timer = Math.floor(ms / 1000 / 60 / 60);
  const min = Math.floor((ms / 1000 / 60) % 60);
  if (timer >= 24) {
    const dage = Math.floor(timer / 24);
    const restTimer = timer % 24;
    return `${dage} dag${dage !== 1 ? 'e' : ''} og ${restTimer} time${restTimer !== 1 ? 'r' : ''}`;
  }
  return `${timer} time${timer !== 1 ? 'r' : ''} og ${min} min`;
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

  const logNøgler: Record<string, string[]> = {
    stps: ['stps-liste', 'stps-detaljer'],
    cvr: ['cvr-berig', 'cvr-ansatte'],
    regnskab: ['regnskab'],
    'monday-sync': ['monday-sync'],
    tp: ['tp-liste', 'tp-detaljer', 'tp-match'],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {SCRAPERS.map((s) => {
        const næste = s.næsteKørsel();
        const msHen = næste.getTime() - nu.getTime();
        const nøgler = logNøgler[s.id] ?? [];
        const seneste = nøgler
          .map((k) => logs[k])
          .filter(Boolean)
          .sort((a, b) => new Date(b.kørtKl).getTime() - new Date(a.kørtKl).getTime())[0];

        return (
          <div key={s.id} className="dashboard-kort" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontWeight: 'var(--fw-medium)', fontSize: 'var(--text-sm)' }}>{s.navn}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.beskrivelse}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem', alignItems: 'center' }}>
              {seneste && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--text-xs)', color: seneste.ok ? 'var(--color-success, #16a34a)' : 'var(--color-danger, #dc2626)' }}>
                  {seneste.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
                  Senest {new Date(seneste.kørtKl).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <Clock size={13} />
                Om {formaterCountdown(msHen)}
                <span style={{ marginLeft: '0.25rem', padding: '0.1rem 0.5rem', borderRadius: '999px', background: s.kilde === 'lokal' ? 'var(--color-warning-bg, #fef3c7)' : 'var(--color-border-light)', fontSize: '0.65rem', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', color: s.kilde === 'lokal' ? '#92400e' : 'var(--color-text-muted)' }}>
                  {s.kilde === 'lokal' ? 'Lokal Mac' : 'Railway'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
