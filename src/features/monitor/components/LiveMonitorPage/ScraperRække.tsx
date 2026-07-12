// src/features/monitor/components/LiveMonitorPage/ScraperRække.tsx

import type { ScraperLogHistorik } from '@/lib/db/ScraperLog';
import type { ScraperLiveStatus } from '@/lib/db/ScraperStatus';
import {
  PALETTE, getStatus, getBehandlet, getSidsteResultatLabel, tidLabel, tidSidenLabel, estimerRestTid,
  type ScraperDef, type Status,
} from './liveMonitorConfig';

// ── Sparkline ──────────────────────────────────────────────────────────────────

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
    <svg width={w} height={h} style={{ flexShrink: 0, opacity: 0.75 }}>
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

// ── StatusDot ─────────────────────────────────────────────────────────────────

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

// ── LiveProgressBar ────────────────────────────────────────────────────────────

function LiveProgressBar({ progress, total, startetKl, accent }: {
  progress: number; total: number; startetKl: string | null; accent: string;
}) {
  const erBestemt = total > 0;
  const pct = erBestemt ? Math.min(100, Math.round((progress / total) * 100)) : 0;
  const restTid = erBestemt && startetKl ? estimerRestTid(startetKl, progress, total) : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {/* Tal-linje */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }}>
          {progress > 0 ? progress.toLocaleString('da-DK') : 'Starter...'}
          {erBestemt && <span style={{ color: '#64748b', fontWeight: 400 }}> / {total.toLocaleString('da-DK')}</span>}
        </span>
        {restTid && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Est. {restTid}</span>}
      </div>

      {/* Bar — bestemt eller indeterminate */}
      <div style={{ height: 4, background: '#0f1f33', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        {erBestemt ? (
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${accent}88, ${accent})`,
            borderRadius: 4, transition: 'width 0.8s ease',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
              animation: 'progressSweep 1.5s linear infinite',
            }} />
          </div>
        ) : (
          /* Indeterminate: løbende stribe på hele baren */
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: `linear-gradient(90deg, transparent 0%, ${accent}88 40%, ${accent} 50%, ${accent}88 60%, transparent 100%)`,
            animation: 'indeterminate 1.4s linear infinite',
          }} />
        )}
      </div>

      {/* Undertext */}
      <span style={{ fontSize: '0.55rem', color: '#475569' }}>
        {erBestemt ? `${pct}% færdig` : 'behandler...'}
      </span>
    </div>
  );
}

// ── ScraperRække (hoved-eksport) ───────────────────────────────────────────────

export function ScraperRække({ scraper, log, forrigeLog, historik, flash, liveStatus }: {
  scraper: ScraperDef;
  log: ScraperLogHistorik | undefined;
  forrigeLog: ScraperLogHistorik | undefined;
  historik: ScraperLogHistorik[];
  flash: boolean;
  liveStatus: ScraperLiveStatus | undefined;
}) {
  const erLive = liveStatus?.status === 'kører';
  const logStatus: Status = erLive ? 'kører' : getStatus(log, scraper.intervalTimer);
  const p = PALETTE[logStatus];

  const antal = log ? getBehandlet(log) : 0;
  const forrigeAntal = forrigeLog ? getBehandlet(forrigeLog) : null;
  const delta = antal > 0 && forrigeAntal != null ? antal - forrigeAntal : null;
  const sparkVærdier = historik.slice(0, 14).map((l) => getBehandlet(l)).reverse();
  const totalBehandlet = historik.reduce((s, l) => s + getBehandlet(l), 0);
  const antalKørsler = historik.length;
  const antalFejlKørsler = historik.filter((l) => !l.ok).length;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.55rem 0.9rem',
      background: '#0b1120',
      borderRadius: 10,
      border: `1px solid ${erLive ? p.accent + '44' : p.dim}`,
      borderLeft: `3px solid ${p.accent}`,
      position: 'relative', overflow: 'hidden',
      flex: 1,
      animation: flash ? 'flashRow 2s ease-out forwards' : undefined,
    }}>

      {/* Freshness bar — bund */}
      {log && logStatus === 'ok' && (
        <div style={{
          position: 'absolute', left: 3, bottom: 0, height: 2,
          width: `${Math.max(4, Math.min(100, (1 - ((Date.now() - new Date(log.kørtKl).getTime()) / 3_600_000) / scraper.intervalTimer) * 100))}%`,
          background: `linear-gradient(90deg, ${p.accent}44, ${p.accent}aa)`,
          transition: 'width 2s ease', borderRadius: '0 2px 2px 0',
        }} />
      )}

      {/* Status dot */}
      <StatusDot color={p.accent} active={logStatus === 'ok' || erLive} />

      {/* Navn + tid */}
      <div style={{ width: 118, flexShrink: 0 }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: logStatus === 'ukendt' ? '#475569' : '#e2e8f0', lineHeight: 1.2 }}>
          {scraper.label}
        </div>
        <div style={{ fontSize: '0.58rem', color: '#64748b', marginTop: '0.1rem' }}>
          kl. {scraper.kørselKl}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        flexShrink: 0, padding: '0.18rem 0.5rem', borderRadius: 999,
        background: p.badge, border: `1px solid ${p.accent}44`,
        fontSize: '0.52rem', fontWeight: 700, color: p.badgeTekst, letterSpacing: '0.08em',
        animation: erLive ? 'liveBlink 2s ease-in-out infinite' : undefined,
      }}>
        {erLive && <span style={{ marginRight: '0.25rem' }}>●</span>}
        {p.label}
      </div>

      {/* Midt-sektion: live progress ELLER historik-data */}
      {erLive ? (
        <LiveProgressBar
          progress={liveStatus.progress}
          total={liveStatus.total}
          startetKl={liveStatus.startetKl}
          accent={p.accent}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Total behandlet */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: totalBehandlet > 0 ? p.accent : '#334155', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {totalBehandlet > 0 ? totalBehandlet.toLocaleString('da-DK') : '—'}
            </div>
            <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '0.1rem' }}>behandlet</div>
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
              <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '0.1rem' }}>kørsler</div>
            </div>
          )}

          {/* Delta */}
          {delta !== null && (
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1, color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#94a3b8' }}>
                {delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : '='}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '0.1rem' }}>ift. forrige</div>
            </div>
          )}

          {/* Bar */}
          {totalBehandlet > 0 && (
            <div style={{ flex: 1, height: 3, background: '#0f1f33', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(100, (totalBehandlet / 500) * 100)}%`,
                background: `linear-gradient(90deg, ${p.accent}44, ${p.accent}88)`,
                borderRadius: 2, position: 'relative', overflow: 'hidden', transition: 'width 1.5s ease',
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
      )}

      {/* Sparkline */}
      {!erLive && sparkVærdier.length >= 2 && (
        <Sparkline værdier={sparkVærdier} color={p.accent} />
      )}

      {/* Tidspunkt + sidste resultat */}
      {log && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: p.accent, fontVariantNumeric: 'tabular-nums' }}>
            {tidLabel(log.kørtKl)}
          </div>
          <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: '0.05rem' }}>
            {tidSidenLabel(log.kørtKl)}
          </div>
          {getSidsteResultatLabel(log) && (
            <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '0.1rem', fontVariantNumeric: 'tabular-nums' }}>
              {getSidsteResultatLabel(log)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
