'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScraperLogHistorik } from '@/lib/db/ScraperLog';

// ─── Konfiguration ───────────────────────────────────────────────────────────

const SCRAPERS: { id: string; label: string; emoji: string }[] = [
  { id: 'stps',              label: 'STPS Rapporter',  emoji: '📋' },
  { id: 'stps-detaljer',     label: 'STPS PDFer',      emoji: '📄' },
  { id: 'stps-fund-items',   label: 'STPS Fund',       emoji: '🔍' },
  { id: 'stps-pnummer',      label: 'P-numre',         emoji: '🏷️' },
  { id: 'cvr-berig',         label: 'CVR Opslag',      emoji: '🏢' },
  { id: 'cvr-ansatte',       label: 'CVR Ansatte',     emoji: '👥' },
  { id: 'tp-match',          label: 'TP Matcher',      emoji: '🔗' },
  { id: 'monday-match',      label: 'Monday',          emoji: '📅' },
  { id: 'regnskab',          label: 'Regnskab',        emoji: '💰' },
];

const POLL_INTERVAL = 15 * 60_000; // 15 minutter

// ─── Hjælpefunktioner ────────────────────────────────────────────────────────

function behandlet(log: ScraperLogHistorik): number {
  if (!log.resultat) return 0;
  return typeof log.resultat.behandlet === 'number' ? log.resultat.behandlet : 0;
}

function fejlBesked(log: ScraperLogHistorik): string | null {
  if (!log.resultat) return null;
  return typeof log.resultat.fejl === 'string' ? log.resultat.fejl : null;
}

function tidLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
}

function datoLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' });
}

type OrbtStatus = 'ny-data' | 'ok' | 'fejl' | 'inaktiv';

function orbStatus(log: ScraperLogHistorik | undefined): OrbtStatus {
  if (!log) return 'inaktiv';
  const alder = Date.now() - new Date(log.kørtKl).getTime();
  if (alder > 12 * 3600_000) return 'inaktiv'; // ældre end 12t
  if (!log.ok) return 'fejl';
  if (behandlet(log) > 0) return 'ny-data';
  return 'ok';
}

// ─── Komponenter ─────────────────────────────────────────────────────────────

function Klokke() {
  const [tid, setTid] = useState('');
  const [dato, setDato] = useState('');
  useEffect(() => {
    function opdater() {
      const nu = new Date();
      setTid(nu.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDato(datoLabel(nu.toISOString()));
    }
    opdater();
    const id = setInterval(opdater, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#e2e8f0', lineHeight: 1 }}>{tid}</div>
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', textTransform: 'capitalize' }}>{dato}</div>
    </div>
  );
}

function ScraperOrb({ scraper, log, pulsér }: {
  scraper: typeof SCRAPERS[0];
  log: ScraperLogHistorik | undefined;
  pulsér: boolean;
}) {
  const status = orbStatus(log);
  const farver: Record<OrbtStatus, { ring: string; glow: string; tekst: string }> = {
    'ny-data':  { ring: '#22c55e', glow: '0 0 20px #22c55e88', tekst: '#86efac' },
    'ok':       { ring: '#f59e0b', glow: '0 0 12px #f59e0b44', tekst: '#fcd34d' },
    'fejl':     { ring: '#ef4444', glow: '0 0 20px #ef444488', tekst: '#fca5a5' },
    'inaktiv':  { ring: '#334155', glow: 'none',               tekst: '#475569' },
  };
  const f = farver[status];
  const antal = log ? behandlet(log) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{
        width: 56, height: 56,
        borderRadius: '50%',
        border: `2px solid ${f.ring}`,
        boxShadow: pulsér ? f.glow : (status !== 'inaktiv' ? f.glow : 'none'),
        background: status === 'inaktiv' ? '#0f172a' : `${f.ring}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem',
        position: 'relative',
        animation: pulsér && status === 'ny-data' ? 'pulseRing 1.5s ease-out 3' : undefined,
      }}>
        {scraper.emoji}
        {status === 'fejl' && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 14, height: 14, borderRadius: '50%',
            background: '#ef4444', border: '2px solid #0f172a',
            animation: 'blink 1s ease-in-out infinite',
          }} />
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.6rem', color: f.tekst, fontWeight: 600, lineHeight: 1.2 }}>{scraper.label}</div>
        {log && status !== 'inaktiv' && (
          <div style={{ fontSize: '0.55rem', color: '#475569', marginTop: '0.1rem' }}>
            {tidLabel(log.kørtKl)}{antal > 0 ? ` · ${antal} nye` : ''}
          </div>
        )}
        {status === 'inaktiv' && (
          <div style={{ fontSize: '0.55rem', color: '#334155' }}>—</div>
        )}
      </div>
    </div>
  );
}

type Begivenhed = ScraperLogHistorik & { nylig: boolean };

function BegivenhedKort({ b, scraperLabel }: { b: Begivenhed; scraperLabel: string }) {
  const antal = behandlet(b);
  const fejl = fejlBesked(b);
  const status: OrbtStatus = !b.ok ? 'fejl' : antal > 0 ? 'ny-data' : 'ok';

  const farver: Record<OrbtStatus, { bg: string; border: string; dot: string }> = {
    'ny-data':  { bg: '#052e16', border: '#166534', dot: '#22c55e' },
    'ok':       { bg: '#1c1408', border: '#78350f', dot: '#f59e0b' },
    'fejl':     { bg: '#2d0a0a', border: '#7f1d1d', dot: '#ef4444' },
    'inaktiv':  { bg: '#0f172a', border: '#1e293b', dot: '#475569' },
  };
  const f = farver[status];

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      background: f.bg,
      border: `1px solid ${f.border}`,
      borderRadius: 10,
      padding: '0.6rem 0.85rem',
      animation: b.nylig ? 'slideIn 0.4s ease-out' : undefined,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: f.dot, flexShrink: 0, marginTop: 5,
        boxShadow: `0 0 6px ${f.dot}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{scraperLabel}</span>
          <span style={{ fontSize: '0.65rem', color: '#475569', flexShrink: 0, marginLeft: '0.5rem' }}>{tidLabel(b.kørtKl)}</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
          {status === 'fejl' && fejl ? `⚠ ${fejl}` : status === 'fejl' ? '⚠ Ukendt fejl' : antal > 0 ? `✓ ${antal} nye poster opdateret` : '○ Ingen nye data denne runde'}
        </div>
      </div>
    </div>
  );
}

// ─── Hoved-komponent ─────────────────────────────────────────────────────────

export function LiveMonitorPage() {
  const [logs, setLogs] = useState<ScraperLogHistorik[]>([]);
  const [begivenheder, setBegivenheder] = useState<Begivenhed[]>([]);
  const [nyligePulser, setNyligePulser] = useState<Set<string>>(new Set());
  const [harFejl, setHarFejl] = useState(false);
  const sidsteIdRef = useRef<number>(0);

  async function hentData(første = false) {
    try {
      const res = await fetch('/api/scrapers/logs/historik');
      const data: ScraperLogHistorik[] = await res.json();

      // Filtrer til seneste 12 timer med aktivitet (behandlet > 0 eller fejl)
      const grænse = Date.now() - 12 * 3600_000;
      const relevante = data
        .filter((l) => new Date(l.kørtKl).getTime() > grænse)
        .filter((l) => !l.ok || (typeof l.resultat?.behandlet === 'number' && l.resultat.behandlet > 0))
        .sort((a, b) => new Date(b.kørtKl).getTime() - new Date(a.kørtKl).getTime())
        .slice(0, 20);

      // Seneste log per scraper (til orbs)
      const alleData = data.filter((l) => new Date(l.kørtKl).getTime() > grænse);
      const senestePerScraper = new Map<string, ScraperLogHistorik>();
      for (const l of [...alleData].sort((a, b) => new Date(b.kørtKl).getTime() - new Date(a.kørtKl).getTime())) {
        if (!senestePerScraper.has(l.scraperId)) senestePerScraper.set(l.scraperId, l);
      }
      setLogs(Array.from(senestePerScraper.values()));

      // Find nye begivenheder siden sidst
      const maxId = sidsteIdRef.current;
      const nyePulserIds = new Set<string>();
      const nyeBeg: Begivenhed[] = relevante.map((l) => {
        const erNy = !første && l.id > maxId;
        if (erNy) nyePulserIds.add(l.scraperId);
        return { ...l, nylig: erNy };
      });

      if (!første && nyePulserIds.size > 0) {
        setNyligePulser(nyePulserIds);
        setTimeout(() => setNyligePulser(new Set()), 5000);
      }

      const nyMaxId = Math.max(...relevante.map((l) => l.id), 0);
      if (nyMaxId > 0) sidsteIdRef.current = nyMaxId;

      setBegivenheder(nyeBeg);
      setHarFejl(relevante.some((l) => !l.ok));
    } catch { /* netværksfejl — prøver igen næste minut */ }
  }

  useEffect(() => {
    hentData(true);
    const id = setInterval(() => hentData(false), POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const logMap = new Map(logs.map((l) => [l.scraperId, l]));

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020617',
      color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 1rem',
      gap: '1rem',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0 #22c55e88; }
          50%  { box-shadow: 0 0 0 14px #22c55e00; }
          100% { box-shadow: 0 0 0 0 #22c55e00; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.05em' }}>
            K KEASCARE
          </div>
          <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.1rem' }}>Live dataoversigt</div>
        </div>
        <Klokke />
      </div>

      {/* Fejl-banner */}
      {harFejl && (
        <div style={{
          background: '#2d0a0a', border: '1px solid #7f1d1d',
          borderRadius: 8, padding: '0.6rem 1rem',
          fontSize: '0.75rem', color: '#fca5a5',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'blink 2s ease-in-out infinite',
        }}>
          ⚠ En eller flere scrapers fejlede — se aktivitetslisten nedenfor
        </div>
      )}

      {/* Scraper orbs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.75rem',
        background: '#0f172a',
        borderRadius: 12,
        padding: '1rem 0.75rem',
        border: '1px solid #1e293b',
      }}>
        {SCRAPERS.map((s) => (
          <ScraperOrb
            key={s.id}
            scraper={s}
            log={logMap.get(s.id)}
            pulsér={nyligePulser.has(s.id)}
          />
        ))}
      </div>

      {/* Aktivitetsfeed */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
        <div style={{ fontSize: '0.65rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.1rem' }}>
          Seneste aktivitet — kun begivenheder med nyt data eller fejl
        </div>
        {begivenheder.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            color: '#334155',
          }}>
            <div style={{ fontSize: '2.5rem' }}>🌙</div>
            <div style={{ fontSize: '0.85rem', textAlign: 'center' }}>
              Ingen ny aktivitet de seneste 12 timer.<br />
              Scrapers kører automatisk fra kl. 19:00.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflow: 'hidden' }}>
            {begivenheder.slice(0, 9).map((b) => {
              const scraperLabel = SCRAPERS.find((s) => s.id === b.scraperId)?.label ?? b.scraperId;
              return <BegivenhedKort key={b.id} b={b} scraperLabel={scraperLabel} />;
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.6rem', color: '#334155',
        borderTop: '1px solid #1e293b', paddingTop: '0.5rem',
      }}>
        <span>Opdaterer hvert 15. minut</span>
        <span>
          I dag: {begivenheder.filter((b) => b.ok && behandlet(b) > 0).reduce((s, b) => s + behandlet(b), 0)} nye poster
          {harFejl ? ' · ⚠ fejl registreret' : ' · ✓ ingen fejl'}
        </span>
      </div>
    </div>
  );
}
