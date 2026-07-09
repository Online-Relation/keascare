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

const PALETTE: Record<Status, { accent: string; dim: string; badge: string; badgeTekst: string; label: string }> = {
  ok:       { accent: '#22c55e', dim: '#22c55e33', badge: '#052e16', badgeTekst: '#4ade80', label: 'OK' },
  advarsel: { accent: '#f59e0b', dim: '#f59e0b33', badge: '#1c1408', badgeTekst: '#fcd34d', label: 'FORSINKET' },
  fejl:     { accent: '#ef4444', dim: '#ef444433', badge: '#450a0a', badgeTekst: '#fca5a5', label: 'FEJL' },
  ukendt:   { accent: '#334155', dim: '#33415511', badge: '#0f172a', badgeTekst: '#475569', label: 'AFVENTER' },
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

// ─── Sonar-dot: permanent pulserende ring ────────────────────────────────────

function SonarDot({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
      {/* Ring 1 */}
      <div style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        border: `1px solid ${color}`,
        animation: `sonarRing 2.4s ease-out ${delay}s infinite`,
        opacity: 0,
      }} />
      {/* Ring 2 — forskudt */}
      <div style={{
        position: 'absolute', inset: -4, borderRadius: '50%',
        border: `1px solid ${color}`,
        animation: `sonarRing 2.4s ease-out ${delay + 1.2}s infinite`,
        opacity: 0,
      }} />
      {/* Kerne */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}`,
      }} />
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
      <div style={{ fontSize: '2rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#f1f5f9', lineHeight: 1, letterSpacing: '-0.02em' }}>{tid}</div>
      <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.15rem', textTransform: 'capitalize' }}>{dato}</div>
    </div>
  );
}

// ─── ScraperRække ─────────────────────────────────────────────────────────────

function ScraperRække({ scraper, log, flash, idx }: {
  scraper: typeof SCRAPERS[0];
  log: ScraperLogHistorik | undefined;
  flash: boolean;
  idx: number;
}) {
  const status = getStatus(log, scraper.intervalTimer);
  const p = PALETTE[status];
  const antal = log ? getBehandlet(log) : 0;
  const timerSiden = log ? (Date.now() - new Date(log.kørtKl).getTime()) / 3_600_000 : null;
  const freshnessWidth = timerSiden != null
    ? Math.max(4, Math.min(100, (1 - timerSiden / scraper.intervalTimer) * 100))
    : 0;

  // Forskud sonar-animation per række
  const sonarDelay = (idx * 0.22) % 2.4;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.6rem 0.9rem',
      background: '#0b1120',
      borderRadius: 10,
      border: `1px solid ${p.dim}`,
      borderLeft: `3px solid ${p.accent}`,
      position: 'relative', overflow: 'hidden',
      flex: 1,
      transition: 'border-color 1s ease',
    }}>
      {/* Flash overlay */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 10,
          background: `${p.accent}22`,
          animation: 'fadeOut 1.5s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* Shimmer-stribe der løber hen over hele rækken */}
      {status === 'ok' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '15%', height: '100%',
          background: `linear-gradient(90deg, transparent, ${p.accent}0a, transparent)`,
          animation: `rowShimmer ${3 + idx * 0.3}s ease-in-out ${idx * 0.4}s infinite`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Freshness bar — bund */}
      {log && status === 'ok' && (
        <div style={{
          position: 'absolute', left: 3, bottom: 0, height: 2,
          width: `${freshnessWidth}%`,
          background: `linear-gradient(90deg, ${p.accent}44, ${p.accent}aa)`,
          transition: 'width 2s ease',
          borderRadius: '0 2px 2px 0',
        }} />
      )}

      {/* Sonar dot */}
      <SonarDot color={p.accent} delay={sonarDelay} />

      {/* Emoji */}
      <span style={{ fontSize: '1rem', flexShrink: 0, opacity: status === 'ukendt' ? 0.25 : 0.9 }}>
        {scraper.emoji}
      </span>

      {/* Navn */}
      <div style={{ width: 120, flexShrink: 0 }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: status === 'ukendt' ? '#2d3f55' : '#cbd5e1', lineHeight: 1.2 }}>
          {scraper.label}
        </div>
        <div style={{ fontSize: '0.56rem', color: '#1e3a5a', marginTop: '0.1rem' }}>
          kl. {scraper.kørselKl}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        flexShrink: 0,
        padding: '0.18rem 0.5rem',
        borderRadius: 999,
        background: p.badge,
        border: `1px solid ${p.accent}44`,
        fontSize: '0.52rem', fontWeight: 700,
        color: p.badgeTekst,
        letterSpacing: '0.08em',
      }}>
        {p.label}
      </div>

      {/* Progress bar med shimmer */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {antal > 0 ? (
          <>
            <div style={{ flex: 1, height: 4, background: '#0f1f33', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (antal / 200) * 100)}%`,
                background: `linear-gradient(90deg, ${p.accent}66, ${p.accent})`,
                borderRadius: 2,
                position: 'relative', overflow: 'hidden',
                transition: 'width 1.5s ease',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                  animation: `shimmer ${2 + idx * 0.15}s ease-in-out ${idx * 0.2}s infinite`,
                }} />
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: p.accent, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {antal}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.62rem', color: '#1e3a5a' }}>
            {log && status === 'ok' ? 'ingen nye' : ''}
          </span>
        )}
      </div>

      {/* Tidspunkt */}
      {log && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: p.accent, fontVariantNumeric: 'tabular-nums' }}>
            {tidLabel(log.kørtKl)}
          </div>
          <div style={{ fontSize: '0.53rem', color: '#1e3a5a', marginTop: '0.05rem' }}>
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
  const [totalOpdateret, setTotalOpdateret] = useState(0);
  const [antalOk, setAntalOk] = useState(0);
  const [uptime, setUptime] = useState(0); // sekunder siden load
  const sidsteMaxId = useRef(0);

  // Uptime-tæller — tikker hvert sekund, viser at siden er levende
  useEffect(() => {
    const id = setInterval(() => setUptime(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function hentData(første = false) {
    try {
      const res = await fetch('/api/scrapers/logs/historik');
      const data: ScraperLogHistorik[] = await res.json();

      const grænse = Date.now() - 36 * 3600_000;
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
      setAntalOk(SCRAPERS.filter(s => getStatus(senesteMap.get(s.id), s.intervalTimer) === 'ok').length);
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
  const uptimeMin = Math.floor(uptime / 60);
  const uptimeSek = uptime % 60;

  return (
    <div style={{
      height: '100vh',
      background: '#020617',
      color: '#e2e8f0',
      fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem 1.1rem',
      gap: '0.65rem',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @keyframes sonarRing {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(500%); }
        }
        @keyframes rowShimmer {
          0%   { transform: translateX(-100%); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateX(800%); opacity: 0; }
        }
        @keyframes scanline {
          0%   { top: -2px; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes blinkRed {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes healthGlow {
          0%, 100% { text-shadow: 0 0 12px #22c55e55; }
          50%       { text-shadow: 0 0 30px #22c55eaa, 0 0 60px #22c55e33; }
        }
        @keyframes uptimeTick {
          from { opacity: 0.6; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Scanline — løber ned over hele siden hele tiden */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2, zIndex: 10,
        background: 'linear-gradient(90deg, transparent, #22c55e22, #22c55e55, #22c55e22, transparent)',
        animation: 'scanline 8s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.2em', color: '#1e3a5a', textTransform: 'uppercase' }}>KeasCare</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginTop: '0.1rem' }}>Live Dataoversigt</div>
        </div>
        <Klokke />
      </div>

      {/* ── KPI-stribe ── */}
      <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
        <div style={{
          flex: 1, background: '#0b1120', borderRadius: 10, padding: '0.65rem 0.9rem',
          border: `1px solid ${healthPct > 70 ? '#22c55e22' : '#ef444422'}`,
        }}>
          <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#1e3a5a', textTransform: 'uppercase', marginBottom: '0.2rem' }}>System health</div>
          <div style={{
            fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            color: healthPct === 100 ? '#22c55e' : healthPct > 70 ? '#f59e0b' : '#ef4444',
            animation: healthPct > 70 ? 'healthGlow 3s ease-in-out infinite' : 'blinkRed 2s ease-in-out infinite',
          }}>
            {healthPct}<span style={{ fontSize: '0.85rem' }}>%</span>
          </div>
          <div style={{ fontSize: '0.56rem', color: '#1e3a5a', marginTop: '0.15rem' }}>{antalOk}/{SCRAPERS.length} ok</div>
        </div>

        <div style={{ flex: 1, background: '#0b1120', borderRadius: 10, padding: '0.65rem 0.9rem', border: '1px solid #0f2040' }}>
          <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#1e3a5a', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Opdateret</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#38bdf8' }}>
            {totalOpdateret.toLocaleString('da-DK')}
          </div>
          <div style={{ fontSize: '0.56rem', color: '#1e3a5a', marginTop: '0.15rem' }}>poster siden natten</div>
        </div>

        {/* Uptime-tæller — tikker hvert sekund = altid bevægelse */}
        <div style={{ flex: 1, background: '#0b1120', borderRadius: 10, padding: '0.65rem 0.9rem', border: '1px solid #0f2040' }}>
          <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#1e3a5a', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Aktiv siden</div>
          <div style={{
            fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#64748b',
            animation: 'uptimeTick 1s ease-in-out infinite alternate',
          }}>
            {String(uptimeMin).padStart(2, '0')}:{String(uptimeSek).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '0.56rem', color: '#1e3a5a', marginTop: '0.15rem' }}>denne session</div>
        </div>

        {antalFejl > 0 && (
          <div style={{
            flex: 1, background: '#1a0505', borderRadius: 10, padding: '0.65rem 0.9rem',
            border: '1px solid #b91c1c33',
            animation: 'blinkRed 2s ease-in-out infinite',
          }}>
            <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#7f1d1d', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Fejl</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: '#ef4444' }}>{antalFejl}</div>
            <div style={{ fontSize: '0.56rem', color: '#7f1d1d', marginTop: '0.15rem' }}>kræver opmærksomhed</div>
          </div>
        )}
      </div>

      {/* ── Scraper rækker ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', overflow: 'hidden' }}>
        {SCRAPERS.map((s, idx) => (
          <ScraperRække
            key={s.id}
            scraper={s}
            log={senesteLog.get(s.id)}
            flash={flashIds.has(s.id)}
            idx={idx}
          />
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '0.52rem', color: '#0f2040' }}>Opdaterer hvert 15. minut</span>
        <span style={{ fontSize: '0.52rem', color: '#0f2040' }}>keascare · live</span>
      </div>
    </div>
  );
}
