'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScraperLogHistorik } from '@/lib/db/ScraperLog';

const SCRAPERS = [
  { id: 'stps-liste',      label: 'STPS Rapporter',  emoji: '📋', kørselKl: '20:00', intervalTimer: 24 },
  { id: 'stps-detaljer',   label: 'STPS PDFer',      emoji: '📄', kørselKl: '21:00', intervalTimer: 24 },
  { id: 'stps-fund-items', label: 'STPS Fund',       emoji: '🔍', kørselKl: '22:00', intervalTimer: 24 },
  { id: 'stps-pnummer',    label: 'P-numre',         emoji: '📍', kørselKl: '23:00', intervalTimer: 24 },
  { id: 'cvr-berig',       label: 'CVR Opslag',      emoji: '🏢', kørselKl: '00:00', intervalTimer: 24 },
  { id: 'cvr-ansatte',     label: 'CVR Ansatte',     emoji: '👥', kørselKl: '03:00', intervalTimer: 24 },
  { id: 'tp-liste',        label: 'TP Liste',        emoji: '📊', kørselKl: '03:00', intervalTimer: 24 },
  { id: 'tp-detaljer',     label: 'TP Detaljer',     emoji: '🗂️',  kørselKl: '03:00', intervalTimer: 24 },
  { id: 'tp-match',        label: 'TP Matcher',      emoji: '🎯', kørselKl: '05:00', intervalTimer: 24 },
  { id: 'monday-sync',     label: 'Monday Sync',     emoji: '🔄', kørselKl: '04:00', intervalTimer: 24 },
  { id: 'regnskab',        label: 'Regnskab',        emoji: '💰', kørselKl: '03:00', intervalTimer: 24 },
];

const POLL_INTERVAL = 15 * 60_000;

type Status = 'ok' | 'advarsel' | 'fejl' | 'ukendt';

function getStatus(log: ScraperLogHistorik | undefined, intervalTimer: number): Status {
  if (!log) return 'ukendt';
  if (!log.ok) return 'fejl';
  const timerSiden = (Date.now() - new Date(log.kørtKl).getTime()) / 3_600_000;
  if (timerSiden > intervalTimer * 1.5) return 'advarsel';
  return 'ok';
}

const PALETTE: Record<Status, { accent: string; glow: string; badge: string; badgeTekst: string; label: string }> = {
  ok:       { accent: '#22c55e', glow: '0 0 24px #22c55e44', badge: '#052e16', badgeTekst: '#4ade80', label: 'OK' },
  advarsel: { accent: '#f59e0b', glow: '0 0 24px #f59e0b44', badge: '#1c1408', badgeTekst: '#fcd34d', label: 'FORSINKET' },
  fejl:     { accent: '#ef4444', glow: '0 0 24px #ef444466', badge: '#450a0a', badgeTekst: '#fca5a5', label: 'FEJL' },
  ukendt:   { accent: '#334155', glow: 'none',                badge: '#0f172a', badgeTekst: '#475569', label: 'AFVENTER' },
};

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
  return m > 0 ? `${t}t ${m}m` : `${t}t`;
}

// ─── Klokke ──────────────────────────────────────────────────────────────────

function Klokke() {
  const [tid, setTid] = useState('');
  const [dato, setDato] = useState('');
  useEffect(() => {
    function opdater() {
      const nu = new Date();
      setTid(nu.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }));
      setDato(nu.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' }));
    }
    opdater();
    const id = setInterval(opdater, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '2.4rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#f1f5f9', lineHeight: 1, letterSpacing: '-0.02em' }}>{tid}</div>
      <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.15rem', textTransform: 'capitalize', letterSpacing: '0.04em' }}>{dato}</div>
    </div>
  );
}

// ─── ScraperRække ─────────────────────────────────────────────────────────────

function ScraperRække({ scraper, log, flash }: {
  scraper: typeof SCRAPERS[0];
  log: ScraperLogHistorik | undefined;
  flash: boolean;
}) {
  const status = getStatus(log, scraper.intervalTimer);
  const p = PALETTE[status];
  const antal = log ? getBehandlet(log) : 0;
  const timerSiden = log ? (Date.now() - new Date(log.kørtKl).getTime()) / 3_600_000 : null;
  const freshnessWidth = timerSiden != null
    ? Math.max(0, Math.min(100, (1 - timerSiden / scraper.intervalTimer) * 100))
    : 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.8rem',
      padding: '0.75rem 1rem',
      background: '#0f172a',
      borderRadius: 12,
      border: `1px solid ${status === 'ukendt' ? '#1e293b' : p.accent}22`,
      borderLeft: `3px solid ${p.accent}`,
      position: 'relative', overflow: 'hidden',
      flex: 1,
      boxShadow: status !== 'ukendt' ? p.glow : 'none',
      animation: flash ? 'pulseIn 0.8s ease-out' : undefined,
      transition: 'border-color 1s ease, box-shadow 1s ease',
    }}>
      {/* Flash */}
      {flash && <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: `${p.accent}22`, animation: 'fadeOut 1s ease-out forwards', pointerEvents: 'none' }} />}

      {/* Freshness bar (baggrundsindikator) */}
      {log && status === 'ok' && (
        <div style={{
          position: 'absolute', left: 0, bottom: 0, height: 2,
          width: `${freshnessWidth}%`,
          background: `linear-gradient(90deg, ${p.accent}88, ${p.accent})`,
          transition: 'width 2s ease',
          borderRadius: '0 2px 2px 0',
        }} />
      )}

      {/* Emoji */}
      <span style={{ fontSize: '1.1rem', flexShrink: 0, opacity: status === 'ukendt' ? 0.3 : 1 }}>
        {scraper.emoji}
      </span>

      {/* Navn + kørselstid */}
      <div style={{ width: 130, flexShrink: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: status === 'ukendt' ? '#334155' : '#e2e8f0', lineHeight: 1.2 }}>
          {scraper.label}
        </div>
        <div style={{ fontSize: '0.58rem', color: '#334155', marginTop: '0.15rem' }}>
          kl. {scraper.kørselKl}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        flexShrink: 0,
        padding: '0.2rem 0.55rem',
        borderRadius: 999,
        background: p.badge,
        border: `1px solid ${p.accent}44`,
        fontSize: '0.55rem', fontWeight: 700,
        color: p.badgeTekst,
        letterSpacing: '0.08em',
      }}>
        {p.label}
      </div>

      {/* Bar + antal */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {antal > 0 && (
          <div style={{ flex: 1, height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (antal / 200) * 100)}%`,
              background: `linear-gradient(90deg, ${p.accent}88, ${p.accent})`,
              borderRadius: 2,
              transition: 'width 1.2s ease',
            }} />
          </div>
        )}
        {antal > 0 && (
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: p.accent, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            {antal}
          </span>
        )}
        {antal === 0 && log && status === 'ok' && (
          <span style={{ fontSize: '0.65rem', color: '#334155' }}>ingen nye</span>
        )}
      </div>

      {/* Sidst kørt */}
      {log && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: p.accent, fontVariantNumeric: 'tabular-nums' }}>
            {tidLabel(log.kørtKl)}
          </div>
          <div style={{ fontSize: '0.55rem', color: '#334155', marginTop: '0.05rem' }}>
            {tidSidenLabel(log.kørtKl)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hoved-komponent ─────────────────────────────────────────────────────────

export function LiveMonitorPage() {
  const [senesteLog, setSenesteLog] = useState<Map<string, ScraperLogHistorik>>(new Map());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const sidsteMaxId = useRef(0);
  const [totalOpdateret, setTotalOpdateret] = useState(0);
  const [antalOk, setAntalOk] = useState(0);

  async function hentData(første = false) {
    try {
      const res = await fetch('/api/scrapers/logs/historik');
      const data: ScraperLogHistorik[] = await res.json();

      const grænse = Date.now() - 36 * 3600_000; // 36 timer for at fange natten
      const sorteret = [...data]
        .filter(l => new Date(l.kørtKl).getTime() > grænse)
        .sort((a, b) => new Date(b.kørtKl).getTime() - new Date(a.kørtKl).getTime());

      const senesteMap = new Map<string, ScraperLogHistorik>();
      for (const l of sorteret) {
        if (!senesteMap.has(l.scraperId)) senesteMap.set(l.scraperId, l);
      }

      const nyeFlashIds = new Set<string>();
      const maxId = Math.max(...data.map(l => l.id), 0);
      if (!første && maxId > sidsteMaxId.current) {
        for (const l of sorteret) {
          if (l.id > sidsteMaxId.current) nyeFlashIds.add(l.scraperId);
        }
      }
      if (nyeFlashIds.size > 0) {
        setFlashIds(nyeFlashIds);
        setTimeout(() => setFlashIds(new Set()), 2000);
      }
      if (maxId > 0) sidsteMaxId.current = maxId;

      setSenesteLog(senesteMap);
      setTotalOpdateret(Array.from(senesteMap.values()).reduce((s, l) => s + getBehandlet(l), 0));
      setAntalOk(SCRAPERS.filter(s => {
        const l = senesteMap.get(s.id);
        return getStatus(l, s.intervalTimer) === 'ok';
      }).length);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    hentData(true);
    const id = setInterval(() => hentData(false), POLL_INTERVAL);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const antalFejl = SCRAPERS.filter(s => getStatus(senesteLog.get(s.id), s.intervalTimer) === 'fejl').length;
  const healthPct = Math.round((antalOk / SCRAPERS.length) * 100);

  return (
    <div style={{
      height: '100vh',
      background: '#020617',
      color: '#e2e8f0',
      fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem 1.1rem',
      gap: '0.7rem',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes pulseIn {
          0%   { box-shadow: 0 0 0 0 #22c55e66; }
          50%  { box-shadow: 0 0 30px 6px #22c55e44; }
          100% { box-shadow: 0 0 8px 0 #22c55e22; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes blinkRed {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.18em', color: '#334155', textTransform: 'uppercase' }}>KeasCare</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.1rem', letterSpacing: '-0.01em' }}>Live Dataoversigt</div>
        </div>
        <Klokke />
      </div>

      {/* ── KPI-stribe ── */}
      <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
        {/* Health */}
        <div style={{
          flex: 1, background: '#0f172a', borderRadius: 12, padding: '0.7rem 0.9rem',
          border: `1px solid ${healthPct === 100 ? '#22c55e33' : healthPct > 70 ? '#f59e0b33' : '#ef444433'}`,
          display: 'flex', flexDirection: 'column', gap: '0.2rem',
        }}>
          <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase' }}>System health</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: healthPct === 100 ? '#22c55e' : healthPct > 70 ? '#f59e0b' : '#ef4444', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {healthPct}<span style={{ fontSize: '0.9rem' }}>%</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: '#334155' }}>{antalOk}/{SCRAPERS.length} scrapers ok</div>
        </div>

        {/* Opdateret i dag */}
        <div style={{ flex: 1, background: '#0f172a', borderRadius: 12, padding: '0.7rem 0.9rem', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase' }}>Opdateret</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1, fontVariantNumeric: 'tabular-nums', animation: 'countUp 0.4s ease' }}>
            {totalOpdateret.toLocaleString('da-DK')}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#334155' }}>poster siden natten</div>
        </div>

        {/* Fejl */}
        {antalFejl > 0 && (
          <div style={{
            flex: 1, background: '#1a0505', borderRadius: 12, padding: '0.7rem 0.9rem',
            border: '1px solid #b91c1c44',
            display: 'flex', flexDirection: 'column', gap: '0.2rem',
            animation: 'blinkRed 2s ease-in-out infinite',
          }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', color: '#7f1d1d', textTransform: 'uppercase' }}>Fejl</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{antalFejl}</div>
            <div style={{ fontSize: '0.6rem', color: '#7f1d1d' }}>kræver opmærksomhed</div>
          </div>
        )}
      </div>

      {/* ── Scraper rækker ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.38rem', overflow: 'hidden' }}>
        {SCRAPERS.map(s => (
          <ScraperRække
            key={s.id}
            scraper={s}
            log={senesteLog.get(s.id)}
            flash={flashIds.has(s.id)}
          />
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0, padding: '0.3rem 0.1rem 0' }}>
        <span style={{ fontSize: '0.55rem', color: '#1e293b' }}>Opdaterer hvert 15. minut</span>
        <span style={{ fontSize: '0.55rem', color: '#1e293b' }}>keascare · live</span>
      </div>
    </div>
  );
}
