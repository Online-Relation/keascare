// src/features/scrapers/components/ScrapersPage/ScraperHistorik/ScraperHistorik.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { CheckCircle, XCircle, Clock, Minus } from 'lucide-react';
import type { ScraperLogHistorik } from '@/lib/db/ScraperLog';

// ── Alle kendte scrapers i kørserækkefølge ──────────────────────────────────

type ScraperMeta = { id: string; label: string; trin?: number; kategori: string };

const ALLE_SCRAPERS: ScraperMeta[] = [
  { id: 'sor-sync',          label: 'SOR — Sync',               trin: 1,  kategori: 'SOR'   },
  { id: 'stps-liste',        label: 'STPS — Hent rapporter',    trin: 2,  kategori: 'STPS'  },
  { id: 'stps-detaljer',     label: "STPS — Parse PDF'er",      trin: 3,  kategori: 'STPS'  },
  { id: 'stps-fund-items',   label: 'STPS — Fund-items',        trin: 4,  kategori: 'STPS'  },
  { id: 'stps-pnummer',      label: 'STPS — P-numre',           trin: 5,  kategori: 'STPS'  },
  { id: 'cvr-berig',         label: 'CVR — Berig',              trin: 6,  kategori: 'CVR'   },
  { id: 'cvr-ansatte',       label: 'CVR — Ansatte & data',     trin: 7,  kategori: 'CVR'   },
  { id: 'cvr-signaler',      label: 'CVR — Signaler',           trin: 8,  kategori: 'CVR'   },
  { id: 'regelovervagning',  label: 'Regelovervågning',         trin: 9,  kategori: 'Regler'},
  { id: 'geocoder',          label: 'Geocoder',                 trin: 10, kategori: 'Geo'   },
  { id: 'los-detaljer',      label: 'LOS — Detaljer',           trin: 11, kategori: 'LOS'   },
  { id: 'los-match',         label: 'LOS — Match',              trin: 12, kategori: 'LOS'   },
];

// ── Hjælpefunktioner ────────────────────────────────────────────────────────

function formatDato(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function formatDatoKort(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', { day: 'numeric', month: 'short' });
}

function hvadSkete(resultat: Record<string, unknown> | null): string {
  if (!resultat) return '—';
  const r = resultat as Record<string, number | string | undefined>;
  if (typeof r.behandlet === 'number' && r.behandlet > 0) return `${r.behandlet} behandlet`;
  if (typeof r.fundet === 'number')   return `${r.fundet} fundet`;
  if (typeof r.matchet === 'number')  return `${r.matchet} matchet`;
  if (typeof r.geocodet === 'number') return `${r.geocodet} geocodet`;
  if (typeof r.hentet === 'number')   return `${r.hentet} hentet`;
  if (typeof r.fejl === 'string')     return r.fejl.slice(0, 60);
  if (typeof r.error === 'string')    return r.error.slice(0, 60);
  if (r.springetOver)                 return 'Sprunget over';
  return 'Kørte OK';
}

// ── Daglig aktivitet — gruppe logs pr. dato ─────────────────────────────────

type DagDatapunkt = { dato: string; datoFull: string; ok: number; fejl: number };

function bygDagData(logs: ScraperLogHistorik[]): DagDatapunkt[] {
  // Sidste 30 dage
  const dagsgrænse = new Date();
  dagsgrænse.setDate(dagsgrænse.getDate() - 29);

  const map = new Map<string, { ok: number; fejl: number }>();

  for (const log of logs) {
    const d = new Date(log.kørtKl);
    if (d < dagsgrænse) continue;
    const key = d.toISOString().slice(0, 10);
    const slot = map.get(key) ?? { ok: 0, fejl: 0 };
    if (log.ok) slot.ok++; else slot.fejl++;
    map.set(key, slot);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { ok, fejl }]) => ({
      dato: formatDatoKort(key + 'T12:00:00'),
      datoFull: key,
      ok,
      fejl,
    }));
}

// ── Systemstatus-tabel ──────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: 'var(--color-surface, #fff)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: '8px',
  fontSize: 12,
  color: 'var(--color-text-primary, #111)',
};

type SenesteMap = Map<string, ScraperLogHistorik>;

function bygSenesteMap(logs: ScraperLogHistorik[]): SenesteMap {
  const map = new Map<string, ScraperLogHistorik>();
  for (const log of [...logs].reverse()) {
    if (!map.has(log.scraperId)) map.set(log.scraperId, log);
  }
  return map;
}

function SystemstatusRække({ meta, log }: { meta: ScraperMeta; log?: ScraperLogHistorik }) {
  if (!log) {
    return (
      <tr className="scraper-sys-række scraper-sys-række--ukendt">
        <td className="scraper-sys-trin">{meta.trin !== undefined ? `#${meta.trin}` : '—'}</td>
        <td className="scraper-sys-navn">{meta.label}</td>
        <td className="scraper-sys-ikon"><Minus size={14} color="#9CA3AF" /></td>
        <td className="scraper-sys-tid scraper-sys-ukendt-tekst">Aldrig kørt</td>
        <td className="scraper-sys-hvad scraper-sys-ukendt-tekst">—</td>
        <td className="scraper-sys-kat"><span className="scraper-sys-kat-badge">{meta.kategori}</span></td>
      </tr>
    );
  }

  const ok = log.ok;
  return (
    <tr className={`scraper-sys-række scraper-sys-række--${ok ? 'ok' : 'fejl'}`}>
      <td className="scraper-sys-trin">{meta.trin !== undefined ? `#${meta.trin}` : '—'}</td>
      <td className="scraper-sys-navn">{meta.label}</td>
      <td className="scraper-sys-ikon">
        {ok
          ? <CheckCircle size={14} color="#16a34a" />
          : <XCircle size={14} color="#dc2626" />}
      </td>
      <td className="scraper-sys-tid">
        <Clock size={10} style={{ marginRight: 4, opacity: 0.5 }} />
        {formatDato(log.kørtKl)}
      </td>
      <td className={`scraper-sys-hvad ${!ok ? 'scraper-sys-fejl-tekst' : ''}`}>
        {hvadSkete(log.resultat)}
      </td>
      <td className="scraper-sys-kat"><span className="scraper-sys-kat-badge">{meta.kategori}</span></td>
    </tr>
  );
}

// ── Hoved-komponent ─────────────────────────────────────────────────────────

export function ScraperHistorik() {
  const [logs, setLogs] = useState<ScraperLogHistorik[]>([]);
  const [indlæser, setIndlæser] = useState(true);

  useEffect(() => {
    fetch('/api/scrapers/logs/historik')
      .then((r) => r.json())
      .then((data: ScraperLogHistorik[]) => setLogs(data))
      .catch(() => {})
      .finally(() => setIndlæser(false));
  }, []);

  if (indlæser) {
    return <div className="scraper-historik-loading">Indlæser historik…</div>;
  }

  if (logs.length === 0) return null;

  const seneste = bygSenesteMap(logs);
  const dagData = bygDagData(logs);

  const totalKørsler = logs.length;
  const antalOk = logs.filter((l) => l.ok).length;
  const succesRate = Math.round((antalOk / totalKørsler) * 100);
  const sidstKørt = logs.at(-1);
  const antalFejl = totalKørsler - antalOk;

  return (
    <section className="scraper-historik">

      {/* ── Systemstatus ── */}
      <div className="scraper-sys-header">
        <h2 className="scraper-historik-titel">Systemstatus</h2>
        <p className="scraper-historik-sub">Seneste kørsel per scraper</p>
      </div>

      <div className="scraper-sys-tabel-wrap">
        <table className="scraper-sys-tabel">
          <thead>
            <tr>
              <th>Trin</th>
              <th>Scraper</th>
              <th>Status</th>
              <th>Seneste kørsel</th>
              <th>Resultat</th>
              <th>Gruppe</th>
            </tr>
          </thead>
          <tbody>
            {ALLE_SCRAPERS.map((meta) => (
              <SystemstatusRække key={meta.id} meta={meta} log={seneste.get(meta.id)} />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Kørselsstatistik ── */}
      <div className="scraper-sys-header" style={{ marginTop: '2rem' }}>
        <h2 className="scraper-historik-titel">Kørselsoversigt</h2>
        <p className="scraper-historik-sub">Daglig aktivitet — antal kørsler OK vs. fejl (30 dage)</p>
      </div>

      <div className="scraper-historik-stats">
        <div className="scraper-historik-stat">
          <span className="scraper-historik-stat-tal">{totalKørsler}</span>
          <span className="scraper-historik-stat-label">Kørsler i alt</span>
        </div>
        <div className="scraper-historik-stat">
          <span className="scraper-historik-stat-tal" style={{ color: '#16a34a' }}>{antalOk}</span>
          <span className="scraper-historik-stat-label">Lykkedes</span>
        </div>
        <div className="scraper-historik-stat">
          <span className="scraper-historik-stat-tal" style={{ color: antalFejl > 0 ? '#dc2626' : undefined }}>
            {antalFejl}
          </span>
          <span className="scraper-historik-stat-label">Fejlede</span>
        </div>
        <div className="scraper-historik-stat">
          <span className={`scraper-historik-stat-tal ${succesRate === 100 ? 'ok' : succesRate >= 80 ? '' : 'advarsel'}`}>
            {succesRate}%
          </span>
          <span className="scraper-historik-stat-label">Succesrate</span>
        </div>
        <div className="scraper-historik-stat">
          <span className="scraper-historik-stat-tal scraper-historik-stat-dato">
            {sidstKørt ? formatDato(sidstKørt.kørtKl) : '—'}
          </span>
          <span className="scraper-historik-stat-label">Seneste kørsel</span>
        </div>
      </div>

      {dagData.length > 0 && (
        <div className="scraper-historik-kort">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dagData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-faint, #F3F4F6)" vertical={false} />
              <XAxis
                dataKey="dato"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(val, name) => {
                  const labels: Record<string, string> = { ok: 'Lykkedes', fejl: 'Fejlede' };
                  return [val, labels[String(name)] ?? String(name)];
                }}
                labelFormatter={(label) => `Dato: ${label}`}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(val) => {
                  const labels: Record<string, string> = { ok: 'Lykkedes', fejl: 'Fejlede' };
                  return labels[String(val)] ?? String(val);
                }}
              />
              <Bar dataKey="ok"   stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="fejl" stackId="a" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </section>
  );
}
