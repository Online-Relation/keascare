'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ScraperLogHistorik } from '@/lib/db/ScraperLog';
import type { ScraperLiveStatus } from '@/lib/db/ScraperStatus';
import { SCRAPERS, SCRAPER_GRUPPER, getStatus, getBehandlet } from './liveMonitorConfig';
import { ScraperRække } from './ScraperRække';

const POLL_LOGS     = 60_000;  // 1 minut
const POLL_LIVE_AKTIV = 5_000; // 5 sek — når noget kører
const POLL_LIVE_IDLE  = 30_000; // 30 sek — når alt er idle

// ── Klokke ────────────────────────────────────────────────────────────────────

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
      <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.15rem', textTransform: 'capitalize' }}>{dato}</div>
    </div>
  );
}

// ── Hoved-komponent ───────────────────────────────────────────────────────────

export function LiveMonitorPage() {
  const searchParams = useSearchParams();
  const fra = searchParams.get('fra');
  const til = searchParams.get('til');

  const [senesteLog,  setSenesteLog]  = useState<Map<string, ScraperLogHistorik>>(new Map());
  const [forrigeLog,  setForrigeLog]  = useState<Map<string, ScraperLogHistorik>>(new Map());
  const [historikLog, setHistorikLog] = useState<Map<string, ScraperLogHistorik[]>>(new Map());
  const [flashIds,    setFlashIds]    = useState<Set<string>>(new Set());
  const [liveStatusMap, setLiveStatusMap] = useState<Map<string, ScraperLiveStatus>>(new Map());
  const [uptime, setUptime] = useState(0);
  const sidsteMaxId = useRef(0);

  // Uptime-tæller
  useEffect(() => {
    const id = setInterval(() => setUptime((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Hent log-historik
  async function hentLogs(første = false) {
    try {
      const res = await fetch('/api/scrapers/logs/historik');
      const data: ScraperLogHistorik[] = await res.json();
      const fraTs = fra ? new Date(fra).getTime() : Date.now() - 36 * 3_600_000;
      const tilTs = til ? new Date(til).getTime() + 86_400_000 : Date.now();

      const sorteret = [...data]
        .filter((l) => { const t = new Date(l.kørtKl).getTime(); return t >= fraTs && t <= tilTs; })
        .sort((a, b) => new Date(b.kørtKl).getTime() - new Date(a.kørtKl).getTime());

      const senesteMap  = new Map<string, ScraperLogHistorik>();
      const forrigeMap  = new Map<string, ScraperLogHistorik>();
      const historikMap = new Map<string, ScraperLogHistorik[]>();
      for (const l of sorteret) {
        historikMap.set(l.scraperId, [...(historikMap.get(l.scraperId) ?? []), l]);
        if (!senesteMap.has(l.scraperId)) senesteMap.set(l.scraperId, l);
        else if (!forrigeMap.has(l.scraperId)) forrigeMap.set(l.scraperId, l);
      }

      const maxId = Math.max(...data.map((l) => l.id), 0);
      if (!første && maxId > sidsteMaxId.current) {
        const nyeIds = new Set(sorteret.filter((l) => l.id > sidsteMaxId.current).map((l) => l.scraperId));
        if (nyeIds.size > 0) {
          setFlashIds(nyeIds);
          setTimeout(() => setFlashIds(new Set()), 2000);
        }
      }
      if (maxId > 0) sidsteMaxId.current = maxId;

      setSenesteLog(senesteMap);
      setForrigeLog(forrigeMap);
      setHistorikLog(historikMap);
    } catch { /* ignore */ }
  }

  // Hent live-status fra scrapers
  async function hentLiveStatus() {
    try {
      const res = await fetch('/api/scrapers/live-status');
      const data: ScraperLiveStatus[] = await res.json();
      const map = new Map<string, ScraperLiveStatus>();
      for (const s of data) map.set(s.scraperId, s);
      setLiveStatusMap(map);
    } catch { /* ignore */ }
  }

  // Log-polling (hvert minut)
  useEffect(() => {
    hentLogs(true);
    const id = setInterval(() => hentLogs(false), POLL_LOGS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fra, til]);

  // Live-status polling (5s hvis noget kører, 30s ellers)
  useEffect(() => {
    hentLiveStatus();
    function sched() {
      const harAktiv = Array.from(liveStatusMap.values()).some((s) => s.status === 'kører');
      return setInterval(hentLiveStatus, harAktiv ? POLL_LIVE_AKTIV : POLL_LIVE_IDLE);
    }
    const id = sched();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStatusMap]);

  // KPI-tal
  const antalOk   = SCRAPERS.filter((s) => getStatus(senesteLog.get(s.id), s.intervalTimer) === 'ok').length;
  const antalFejl = SCRAPERS.filter((s) => getStatus(senesteLog.get(s.id), s.intervalTimer) === 'fejl').length;
  const antalLive = Array.from(liveStatusMap.values()).filter((s) => s.status === 'kører').length;
  const healthPct = Math.round((antalOk / SCRAPERS.length) * 100);
  const totalBehandlet = Array.from(senesteLog.values()).reduce((s, l) => s + getBehandlet(l), 0);
  const uptimMin  = Math.floor(uptime / 60);
  const uptimSek  = uptime % 60;

  return (
    <div style={{
      minHeight: '100vh', background: '#020617', color: '#e2e8f0',
      fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '1rem 1.1rem', gap: '0.65rem', boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes dotBreath      { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes liveBlink      { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes flashRow       { 0%{background:#22c55e0a} 100%{background:transparent} }
        @keyframes healthGlow     { 0%,100%{text-shadow:0 0 12px #22c55e44} 50%{text-shadow:0 0 20px #22c55e88} }
        @keyframes blinkRed       { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes uptimeTick     { from{opacity:0.6} to{opacity:1} }
        @keyframes progressSweep   { 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }
        @keyframes indeterminate   { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes shimmer        { 0%,94%{transform:translateX(-200%);opacity:0} 95%{opacity:1} 99%{transform:translateX(500%);opacity:1} 100%{transform:translateX(500%);opacity:0} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.2em', color: '#334155', textTransform: 'uppercase' }}>KeasCare</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.1rem' }}>Live Dataoversigt</div>
        </div>
        <Klokke />
      </div>

      {/* ── KPI-stribe ── */}
      <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
        <div style={{ flex: 1, background: '#0b1120', borderRadius: 10, padding: '0.65rem 0.9rem', border: `1px solid ${healthPct > 70 ? '#22c55e22' : '#ef444422'}` }}>
          <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.2rem' }}>System health</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: healthPct === 100 ? '#22c55e' : healthPct > 70 ? '#f59e0b' : '#ef4444', animation: healthPct > 70 ? 'healthGlow 3s ease-in-out infinite' : 'blinkRed 2s ease-in-out infinite' }}>
            {healthPct}<span style={{ fontSize: '0.85rem' }}>%</span>
          </div>
          <div style={{ fontSize: '0.56rem', color: '#64748b', marginTop: '0.15rem' }}>{antalOk}/{SCRAPERS.length} ok</div>
        </div>

        <div style={{ flex: 1, background: '#0b1120', borderRadius: 10, padding: '0.65rem 0.9rem', border: '1px solid #0f2040' }}>
          <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Opdateret</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#38bdf8' }}>{totalBehandlet.toLocaleString('da-DK')}</div>
          <div style={{ fontSize: '0.56rem', color: '#64748b', marginTop: '0.15rem' }}>poster i perioden</div>
        </div>

        {antalLive > 0 ? (
          <div style={{ flex: 1, background: '#0c1a2e', borderRadius: 10, padding: '0.65rem 0.9rem', border: '1px solid #38bdf833', animation: 'liveBlink 2s ease-in-out infinite' }}>
            <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Live nu</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: '#38bdf8' }}>{antalLive}</div>
            <div style={{ fontSize: '0.56rem', color: '#64748b', marginTop: '0.15rem' }}>scraper{antalLive > 1 ? 'e' : ''} kører</div>
          </div>
        ) : (
          <div style={{ flex: 1, background: '#0b1120', borderRadius: 10, padding: '0.65rem 0.9rem', border: '1px solid #0f2040' }}>
            <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Aktiv siden</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: '#64748b', animation: 'uptimeTick 1s ease-in-out infinite alternate' }}>
              {String(uptimMin).padStart(2, '0')}:{String(uptimSek).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.56rem', color: '#64748b', marginTop: '0.15rem' }}>denne session</div>
          </div>
        )}

        {antalFejl > 0 && (
          <div style={{ flex: 1, background: '#1a0505', borderRadius: 10, padding: '0.65rem 0.9rem', border: '1px solid #b91c1c33', animation: 'blinkRed 2s ease-in-out infinite' }}>
            <div style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#7f1d1d', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Fejl</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: '#ef4444' }}>{antalFejl}</div>
            <div style={{ fontSize: '0.56rem', color: '#7f1d1d', marginTop: '0.15rem' }}>kræver opmærksomhed</div>
          </div>
        )}
      </div>

      {/* ── Scraper grupper ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'auto' }}>
        {SCRAPER_GRUPPER.map((gruppe) => (
          <div key={gruppe.label}>
            {/* Gruppe-header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.14em', color: '#334155', textTransform: 'uppercase' }}>
                {gruppe.label}
              </span>
              <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
            </div>

            {/* Rækker i gruppen */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {gruppe.scrapers.map((s) => (
                <ScraperRække
                  key={s.id}
                  scraper={s}
                  log={senesteLog.get(s.id)}
                  forrigeLog={forrigeLog.get(s.id)}
                  historik={historikLog.get(s.id) ?? []}
                  flash={flashIds.has(s.id)}
                  liveStatus={liveStatusMap.get(s.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '0.52rem', color: '#334155' }}>Log opdaterer hvert minut · Live status hvert 5s</span>
        <span style={{ fontSize: '0.52rem', color: '#334155' }}>keascare · live</span>
      </div>
    </div>
  );
}
