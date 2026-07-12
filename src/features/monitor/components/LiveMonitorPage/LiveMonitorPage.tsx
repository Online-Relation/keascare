'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

const POLL_INTERVAL = 60_000; // 1 minut

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

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ værdier, color }: { værdier: number[]; color: string }) {
  if (værdier.length < 2) return null;
  const w = 64, h = 22;
  const max = Math.max(...værdier, 1);
  const pts = værdier.map((v, i) => {
    const x = (i / (værdier.length - 1)) * w;
    const y = h - (v / max) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  const stigning = værdier[værdier.length - 1] - værdier[0];
  const trendFarve = stigning > 0 ? '#22c55e' : stigning < 0 ? '#ef4444' : color;

  return (
    <svg width={w} height={h} style={{ flexShrink: 0, opacity: 0.7 }}>
      <polyline points={pts} fill="none" stroke={trendFarve} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {værdier.map((v, i) => {
        const x = (i / (værdier.length - 1)) * w;
        const y = h - (v / max) * (h - 2) - 1;
        return i === værdier.length - 1
          ? <circle key={i} cx={x} cy={y} r="2.5" fill={trendFarve} />
          : null;
      })}
    </svg>
  );
}

// ─── Status-dot ──────────────────────────────────────────────────────────────

function StatusDot({ color, active }: { color: string; active: boolean }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
      background: color,
      boxShadow: active ? `0 0 5px ${color}88` : 'none',
      animation: active ? 'dotBreath 4s ease-in-out infinite' : undefined,
    }} />
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

function ScraperRække({ scraper, log, forrigeLog, historik, flash }: {
  scraper: typeof SCRAPERS[0];
  log: ScraperLogHistorik | undefined;
  forrigeLog: ScraperLogHistorik | undefined;
  historik: ScraperLogHistorik[];
  flash: boolean;
}) {
  const status = getStatus(log, scraper.intervalTimer);
  const p = PALETTE[status];
  const antal = log ? getBehandlet(log) : 0;
  const timerSiden = log ? (Date.now() - new Date(log.kørtKl).getTime()) / 3_600_000 : null;
  const freshnessWidth = timerSiden != null
    ? Math.max(4, Math.min(100, (1 - timerSiden / scraper.intervalTimer) * 100))
    : 0;

  const forrigeAntal = forrigeLog ? getBehandlet(forrigeLog) : null;
  const delta = antal > 0 && forrigeAntal != null ? antal - forrigeAntal : null;
  const sparkVærdier = historik.slice(0, 14).map(l => getBehandlet(l)).reverse();

  // Periode-totaler (baseret på hele historik i valgt datointerval)
  const totalBehandlet = historik.reduce((s, l) => s + getBehandlet(l), 0);
  const antalKørsler = historik.length;
  const antalFejlKørsler = historik.filter(l => !l.ok).length;

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
      animation: flash ? 'flashRow 2s ease-out forwards' : undefined,
    }}>

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

      {/* Status dot */}
      <StatusDot color={p.accent} active={status === 'ok'} />

      {/* Emoji */}
      <span style={{ fontSize: '1rem', flexShrink: 0, opacity: status === 'ukendt' ? 0.25 : 0.9 }}>
        {scraper.emoji}
      </span>

      {/* Navn */}
      <div style={{ width: 120, flexShrink: 0 }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: status === 'ukendt' ? '#2d3f55' : '#cbd5e1', lineHeight: 1.2 }}>
          {scraper.label}
        </div>
        <div style={{ fontSize: '0.56rem', color: '#475569', marginTop: '0.1rem' }}>
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

      {/* Periode-data */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Total behandlet */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: totalBehandlet > 0 ? p.accent : '#475569', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {totalBehandlet > 0 ? totalBehandlet.toLocaleString('da-DK') : '—'}
          </div>
          <div style={{ fontSize: '0.52rem', color: '#475569', marginTop: '0.1rem' }}>behandlet</div>
        </div>

        {/* Kørsler */}
        {antalKørsler > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {antalKørsler}
              {antalFejlKørsler > 0 && (
                <span style={{ fontSize: '0.65rem', color: '#ef4444', marginLeft: '0.2rem' }}>/{antalFejlKørsler} fejl</span>
              )}
            </div>
            <div style={{ fontSize: '0.52rem', color: '#475569', marginTop: '0.1rem' }}>kørsler</div>
          </div>
        )}

        {/* Delta ift. forrige kørsel */}
        {delta !== null && (
          <div style={{ flexShrink: 0 }}>
            <div style={{
              fontSize: '0.85rem', fontWeight: 700, lineHeight: 1,
              color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#94a3b8',
            }}>
              {delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : '='}
            </div>
            <div style={{ fontSize: '0.52rem', color: '#475569', marginTop: '0.1rem' }}>ift. forrige</div>
          </div>
        )}

        {/* Bar — viser relativ mængde */}
        {totalBehandlet > 0 && (
          <div style={{ flex: 1, height: 3, background: '#0f1f33', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (totalBehandlet / 500) * 100)}%`,
              background: `linear-gradient(90deg, ${p.accent}44, ${p.accent}88)`,
              borderRadius: 2,
              position: 'relative', overflow: 'hidden',
              transition: 'width 1.5s ease',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 300s linear infinite',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparkVærdier.length >= 2 && (
        <Sparkline værdier={sparkVærdier} color={p.accent} />
      )}

      {/* Tidspunkt */}
      {log && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: p.accent, fontVariantNumeric: 'tabular-nums' }}>
            {tidLabel(log.kørtKl)}
          </div>
          <div style={{ fontSize: '0.53rem', color: '#475569', marginTop: '0.05rem' }}>
            {tidSidenLabel(log.kørtKl)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hoved-komponent ─────────────────────────────────────────────────────────

export function LiveMonitorPage() {
  const searchParams = useSearchParams();
  const fra = searchParams.get('fra');
  const til = searchParams.get('til');
  const [senesteLog, setSenesteLog] = useState<Map<string, ScraperLogHistorik>>(new Map());
  const [forrigeLog, setForrigeLog] = useState<Map<string, ScraperLogHistorik>>(new Map());
  const [historikLog, setHistorikLog] = useState<Map<string, ScraperLogHistorik[]>>(new Map());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [totalOpdateret, setTotalOpdateret] = useState(0);
  const [antalOk, setAntalOk] = useState(0);
  const [uptime, setUptime] = useState(0);
  const sidsteMaxId = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setUptime(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function hentData(første = false) {
    try {
      const res = await fetch('/api/scrapers/logs/historik');
      const data: ScraperLogHistorik[] = await res.json();

      const fraTs = fra ? new Date(fra).getTime() : Date.now() - 36 * 3600_000;
      const tilTs = til ? new Date(til).getTime() + 86_400_000 : Date.now();

      const sorteret = [...data]
        .filter(l => {
          const t = new Date(l.kørtKl).getTime();
          return t >= fraTs && t <= tilTs;
        })
        .sort((a, b) => new Date(b.kørtKl).getTime() - new Date(a.kørtKl).getTime());

      const senesteMap = new Map<string, ScraperLogHistorik>();
      const forrigeMap = new Map<string, ScraperLogHistorik>();
      const historikMap = new Map<string, ScraperLogHistorik[]>();
      for (const l of sorteret) {
        // Gem alle logs i perioden (til totaler + sparkline)
        historikMap.set(l.scraperId, [...(historikMap.get(l.scraperId) ?? []), l]);
        if (!senesteMap.has(l.scraperId)) {
          senesteMap.set(l.scraperId, l);
        } else if (!forrigeMap.has(l.scraperId)) {
          forrigeMap.set(l.scraperId, l);
        }
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
      setForrigeLog(forrigeMap);
      setHistorikLog(historikMap);
      setTotalOpdateret(Array.from(senesteMap.values()).reduce((s, l) => s + getBehandlet(l), 0));
      setAntalOk(SCRAPERS.filter(s => getStatus(senesteMap.get(s.id), s.intervalTimer) === 'ok').length);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    hentData(true);
    const id = setInterval(() => hentData(false), POLL_INTERVAL);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fra, til]);

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
        @keyframes shimmer {
          0%, 94%  { transform: translateX(-200%); opacity: 0; }
          95%      { opacity: 1; }
          99%      { transform: translateX(500%); opacity: 1; }
          100%     { transform: translateX(500%); opacity: 0; }
        }
        @keyframes flashRow {
          0%   { background: #22c55e0a; }
          100% { background: transparent; }
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
          0%, 100% { text-shadow: 0 0 12px #22c55e44; }
          50%       { text-shadow: 0 0 20px #22c55e88; }
        }
        @keyframes uptimeTick {
          from { opacity: 0.6; }
          to   { opacity: 1; }
        }
        @keyframes dotBreath {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.2em', color: '#475569', textTransform: 'uppercase' }}>KeasCare</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.1rem' }}>Live Dataoversigt</div>
        </div>
        <Klokke />
      </div>

      {/* ── KPI-stribe ── */}
      <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
        <div style={{
          flex: 1, background: '#0b1120', borderRadius: 10, padding: '0.65rem 0.9rem',
          border: `1px solid ${healthPct > 70 ? '#22c55e22' : '#ef444422'}`,
        }}>
          <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.2rem' }}>System health</div>
          <div style={{
            fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            color: healthPct === 100 ? '#22c55e' : healthPct > 70 ? '#f59e0b' : '#ef4444',
            animation: healthPct > 70 ? 'healthGlow 3s ease-in-out infinite' : 'blinkRed 2s ease-in-out infinite',
          }}>
            {healthPct}<span style={{ fontSize: '0.85rem' }}>%</span>
          </div>
          <div style={{ fontSize: '0.56rem', color: '#475569', marginTop: '0.15rem' }}>{antalOk}/{SCRAPERS.length} ok</div>
        </div>

        <div style={{ flex: 1, background: '#0b1120', borderRadius: 10, padding: '0.65rem 0.9rem', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Opdateret</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#38bdf8' }}>
            {totalOpdateret.toLocaleString('da-DK')}
          </div>
          <div style={{ fontSize: '0.56rem', color: '#475569', marginTop: '0.15rem' }}>poster siden natten</div>
        </div>

        {/* Uptime-tæller — tikker hvert sekund = altid bevægelse */}
        <div style={{ flex: 1, background: '#0b1120', borderRadius: 10, padding: '0.65rem 0.9rem', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Aktiv siden</div>
          <div style={{
            fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#64748b',
            animation: 'uptimeTick 1s ease-in-out infinite alternate',
          }}>
            {String(uptimeMin).padStart(2, '0')}:{String(uptimeSek).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '0.56rem', color: '#475569', marginTop: '0.15rem' }}>denne session</div>
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
        {SCRAPERS.map((s) => (
          <ScraperRække
            key={s.id}
            scraper={s}
            log={senesteLog.get(s.id)}
            forrigeLog={forrigeLog.get(s.id)}
            historik={historikLog.get(s.id) ?? []}
            flash={flashIds.has(s.id)}
          />
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '0.52rem', color: '#334155' }}>Opdaterer hvert minut</span>
        <span style={{ fontSize: '0.52rem', color: '#334155' }}>keascare · live</span>
      </div>
    </div>
  );
}
