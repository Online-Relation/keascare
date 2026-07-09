'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScraperLogHistorik } from '@/lib/db/ScraperLog';

// id skal matche hvad logScraperKørsel bruger i API-routes
// intervalTimer = forventet interval i timer (bruges til at afgøre om den er "forsinket")
const SCRAPERS: { id: string; label: string; kørselKl: string; intervalTimer: number }[] = [
  { id: 'stps-liste',      label: 'STPS Rapporter', kørselKl: '20:00', intervalTimer: 24 },
  { id: 'stps-detaljer',   label: 'STPS PDFer',     kørselKl: '21:00', intervalTimer: 24 },
  { id: 'stps-fund-items', label: 'STPS Fund',      kørselKl: '22:00', intervalTimer: 24 },
  { id: 'stps-pnummer',    label: 'P-numre',        kørselKl: '23:00', intervalTimer: 24 },
  { id: 'cvr-berig',       label: 'CVR Opslag',     kørselKl: '00:00', intervalTimer: 24 },
  { id: 'cvr-ansatte',     label: 'CVR Ansatte',    kørselKl: '03:00', intervalTimer: 24 },
  { id: 'tp-liste',        label: 'TP Liste',       kørselKl: '03:00', intervalTimer: 24 },
  { id: 'tp-detaljer',     label: 'TP Detaljer',    kørselKl: '03:00', intervalTimer: 24 },
  { id: 'tp-match',        label: 'TP Matcher',     kørselKl: '05:00', intervalTimer: 24 },
  { id: 'monday-sync',     label: 'Monday Sync',    kørselKl: '04:00', intervalTimer: 24 },
  { id: 'regnskab',        label: 'Regnskab',       kørselKl: '03:00', intervalTimer: 24 },
];

const POLL_INTERVAL = 15 * 60_000;

// ─── Temperaturfarve ─────────────────────────────────────────────────────────
// Grøn (netop opdateret) → gul → orange → rød (ingen data i lang tid)

function tempFarve(sidstOkKl: string | null, harFejl: boolean, intervalTimer: number): {
  bg: string; border: string; tekst: string; glow: string;
} {
  if (harFejl) return { bg: '#450a0a', border: '#b91c1c', tekst: '#fca5a5', glow: '#ef444466' };
  if (!sidstOkKl) return { bg: '#1a0505', border: '#7f1d1d', tekst: '#6b2121', glow: '#7f1d1d44' };

  const timerSiden = (Date.now() - new Date(sidstOkKl).getTime()) / 3_600_000;
  const iv = intervalTimer;

  if (timerSiden < iv)        return { bg: '#052e16', border: '#16a34a', tekst: '#86efac', glow: '#22c55e88' };
  if (timerSiden < iv * 1.2)  return { bg: '#14290f', border: '#15803d', tekst: '#4ade80', glow: '#22c55e44' };
  if (timerSiden < iv * 1.5)  return { bg: '#1c1408', border: '#92400e', tekst: '#fcd34d', glow: '#f59e0b44' };
  if (timerSiden < iv * 2.0)  return { bg: '#1f1008', border: '#c2410c', tekst: '#fdba74', glow: '#f9731644' };
  return                             { bg: '#1a0505', border: '#7f1d1d', tekst: '#f87171', glow: '#ef444433' };
}

// ─── Hjælpefunktioner ────────────────────────────────────────────────────────

function getBehandlet(log: ScraperLogHistorik): number {
  return typeof log.resultat?.behandlet === 'number' ? log.resultat.behandlet : 0;
}

function tidLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
}

function tidSidenLabel(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1)   return 'lige nu';
  if (min < 60)  return `${min}m siden`;
  const t = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${t}t ${m}m siden` : `${t}t siden`;
}

// ─── ScraperCelle ────────────────────────────────────────────────────────────

function ScraperCelle({ scraper, log, flash }: {
  scraper: typeof SCRAPERS[0];
  log: ScraperLogHistorik | undefined;
  flash: boolean;
}) {
  const harFejl = !!log && !log.ok;
  const f = tempFarve(log && log.ok ? log.kørtKl : null, harFejl, scraper.intervalTimer);
  const antal = log ? getBehandlet(log) : 0;

  return (
    <div style={{
      background: f.bg,
      border: `1px solid ${f.border}`,
      borderRadius: 12,
      padding: '0.9rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: `0 0 18px ${f.glow}`,
      position: 'relative',
      overflow: 'hidden',
      animation: flash ? 'flashGreen 1.2s ease-out' : undefined,
      transition: 'background 2s ease, border-color 2s ease, box-shadow 2s ease',
    }}>
      {/* Flash overlay */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          animation: 'flashOverlay 1.2s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: f.tekst, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {scraper.label}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
        {log ? (
          <>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: f.tekst, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {harFejl ? '⚠' : antal > 0 ? antal : '—'}
            </div>
            <div style={{ fontSize: '0.6rem', color: f.tekst, opacity: 0.7, marginTop: '0.2rem' }}>
              {harFejl ? 'fejl' : antal > 0 ? 'nye poster' : 'ingen nye'}
            </div>
            <div style={{ fontSize: '0.55rem', color: f.tekst, opacity: 0.5, marginTop: '0.4rem' }}>
              {tidLabel(log.kørtKl)} · {tidSidenLabel(log.kørtKl)}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '1.2rem', color: '#4a1515', lineHeight: 1 }}>—</div>
            <div style={{ fontSize: '0.55rem', color: '#4a1515', marginTop: '0.3rem' }}>ikke kørt</div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Klokke ──────────────────────────────────────────────────────────────────

function Klokke() {
  const [tid, setTid] = useState('');
  const [dato, setDato] = useState('');
  useEffect(() => {
    function opdater() {
      const nu = new Date();
      setTid(nu.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDato(nu.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' }));
    }
    opdater();
    const id = setInterval(opdater, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0', lineHeight: 1 }}>{tid}</div>
      <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.1rem', textTransform: 'capitalize' }}>{dato}</div>
    </div>
  );
}

// ─── Hoved-komponent ─────────────────────────────────────────────────────────

export function LiveMonitorPage() {
  const [senesteLog, setSenesteLog] = useState<Map<string, ScraperLogHistorik>>(new Map());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [harFejl, setHarFejl] = useState(false);
  const sidsteMaxId = useRef(0);

  async function hentData(første = false) {
    try {
      const res = await fetch('/api/scrapers/logs/historik');
      const data: ScraperLogHistorik[] = await res.json();

      // Seneste log per scraper (til celler)
      const grænse = Date.now() - 24 * 3600_000;
      const nyeFlashIds = new Set<string>();
      const senesteMap = new Map<string, ScraperLogHistorik>();
      const sorteret = [...data]
        .filter(l => new Date(l.kørtKl).getTime() > grænse)
        .sort((a, b) => new Date(b.kørtKl).getTime() - new Date(a.kørtKl).getTime());

      for (const l of sorteret) {
        if (!senesteMap.has(l.scraperId)) senesteMap.set(l.scraperId, l);
      }

      // Aktivitetsfeed — én linje per scraper (seneste kørsel med data eller fejl)
      const feedMap = new Map<string, ScraperLogHistorik>();
      for (const l of sorteret) {
        if (!feedMap.has(l.scraperId) && (!l.ok || getBehandlet(l) > 0)) {
          feedMap.set(l.scraperId, l);
        }
      }
      const aktivitet = Array.from(feedMap.values())
        .sort((a, b) => new Date(b.kørtKl).getTime() - new Date(a.kørtKl).getTime())
        .slice(0, 8)
        .map(l => {
          const erNy = !første && l.id > sidsteMaxId.current;
          if (erNy) nyeFlashIds.add(l.scraperId);
          return { ...l, nylig: erNy };
        });

      if (!første && nyeFlashIds.size > 0) {
        setFlashIds(nyeFlashIds);
        setTimeout(() => setFlashIds(new Set()), 3000);
      }

      const maxId = Math.max(...data.map(l => l.id), 0);
      if (maxId > 0) sidsteMaxId.current = maxId;

      setSenesteLog(senesteMap);
      setHarFejl(Array.from(senesteMap.values()).some(l => !l.ok));
    } catch { /* ignore */ }
  }

  useEffect(() => {
    hentData(true);
    const id = setInterval(() => hentData(false), POLL_INTERVAL);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      height: '100vh',
      background: '#020617',
      color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem',
      gap: '0.85rem',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes flashOverlay {
          0%   { background: rgba(134,239,172,0.5); }
          100% { background: transparent; }
        }
        @keyframes flashGreen {
          0%   { box-shadow: 0 0 0 0 #22c55e99; }
          40%  { box-shadow: 0 0 30px 8px #22c55e66; }
          100% { box-shadow: 0 0 18px ${'{'}/* dynamic */'#22c55e22'}; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes blinkRed {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>KEASCARE</div>
          <div style={{ fontSize: '0.6rem', color: '#334155', marginTop: '0.1rem' }}>Live dataoversigt</div>
        </div>
        <Klokke />
      </div>

      {/* Fejl-banner */}
      {harFejl && (
        <div style={{
          background: '#2d0a0a', border: '1px solid #b91c1c',
          borderRadius: 8, padding: '0.5rem 0.85rem',
          fontSize: '0.75rem', color: '#fca5a5',
          animation: 'blinkRed 2s ease-in-out infinite',
          flexShrink: 0,
        }}>
          ⚠ En eller flere scrapers fejlede
        </div>
      )}

      {/* Scraper tabel — én fast række per scraper */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', overflow: 'hidden' }}>
        {SCRAPERS.map(s => {
          const log = senesteLog.get(s.id);
          const antal = log ? getBehandlet(log) : 0;
          const harFejl = !!log && !log.ok;
          const flash = flashIds.has(s.id);
          const f = tempFarve(log && log.ok ? log.kørtKl : null, harFejl, s.intervalTimer);

          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.6rem 0.85rem',
              background: f.bg,
              border: `1px solid ${f.border}`,
              borderRadius: 10,
              position: 'relative', overflow: 'hidden',
              flex: 1,
              animation: flash ? 'flashGreen 1.2s ease-out' : undefined,
              transition: 'background 2s ease, border-color 2s ease',
            }}>
              {flash && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: 10, animation: 'flashOverlay 1.2s ease-out forwards', pointerEvents: 'none' }} />
              )}

              {/* Status dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: f.border,
                boxShadow: `0 0 6px ${f.glow}`,
              }} />

              {/* Navn */}
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: f.tekst, width: 120, flexShrink: 0 }}>
                {s.label}
              </span>

              {/* Antal-bar */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {antal > 0 && (
                  <div style={{
                    height: 6, borderRadius: 3,
                    background: f.border,
                    width: `${Math.min(100, (antal / 50) * 100)}%`,
                    maxWidth: '60%',
                    boxShadow: `0 0 4px ${f.glow}`,
                    transition: 'width 0.8s ease',
                  }} />
                )}
                <span style={{ fontSize: '0.7rem', color: f.tekst, opacity: 0.8, whiteSpace: 'nowrap' }}>
                  {harFejl ? '⚠ fejl' : antal > 0 ? `${antal} opdateret` : log ? 'ingen nye' : '—'}
                </span>
              </div>

              {/* Tid */}
              <span style={{ fontSize: '0.6rem', color: f.tekst, opacity: 0.5, flexShrink: 0 }}>
                {log ? tidLabel(log.kørtKl) : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ fontSize: '0.55rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span>Opdaterer hvert 15. minut</span>
        <span>{Array.from(senesteLog.values()).reduce((s, l) => s + getBehandlet(l), 0)} opdateret i dag</span>
      </div>
    </div>
  );
}
