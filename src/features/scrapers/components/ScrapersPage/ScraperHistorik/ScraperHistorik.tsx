// src/features/scrapers/components/ScrapersPage/ScraperHistorik/ScraperHistorik.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, LineChart, Line,
} from 'recharts';
import type { ScraperLogHistorik } from '@/lib/db/ScraperLog';

const SCRAPER_LABELS: Record<string, string> = {
  'stps-liste':       'STPS liste',
  'stps-detaljer':    'STPS PDF',
  'stps-fund-items':  'STPS fund-items',
  'stps-pnummer':     'STPS P-numre',
  'cvr-berig':        'CVR',
  'tp-liste':         'TP liste',
  'tp-detaljer':      'TP detaljer',
  'tp-match':         'TP match',
};

const SCRAPER_FARVER: Record<string, string> = {
  'stps-liste':       '#6366F1',
  'stps-detaljer':    '#8B5CF6',
  'stps-fund-items':  '#A855F7',
  'stps-pnummer':     '#EC4899',
  'cvr-berig':        '#F59E0B',
  'tp-liste':         '#10B981',
  'tp-detaljer':      '#0EA5E9',
  'tp-match':         '#14B8A6',
};

function formatTid(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatKort(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', {
    hour: '2-digit', minute: '2-digit',
  });
}

type AktivitetDatapunkt = {
  tid: string;
  tidFull: string;
  behandlet: number;
  scraper: string;
  ok: boolean;
};

type FundItemDatapunkt = {
  kørsel: string;
  fundet: number;
  behandlet: number;
  ingenItems: number;
};

type TpDatapunkt = {
  kørsel: string;
  matchet: number;
  ingenMatch: number;
};

function bygAktivitetData(logs: ScraperLogHistorik[]): AktivitetDatapunkt[] {
  return logs.map((log) => ({
    tid: formatKort(log.kørtKl),
    tidFull: formatTid(log.kørtKl),
    behandlet: (log.resultat?.behandlet as number) ?? 0,
    scraper: log.scraperId,
    ok: log.ok,
  }));
}

function bygFundItemData(logs: ScraperLogHistorik[]): FundItemDatapunkt[] {
  return logs
    .filter((l) => l.scraperId === 'stps-fund-items')
    .map((log, i) => ({
      kørsel: `#${i + 1}`,
      fundet: (log.resultat?.fundet as number) ?? 0,
      behandlet: (log.resultat?.behandlet as number) ?? 0,
      ingenItems: (log.resultat?.ingenItems as number) ?? 0,
    }));
}

function bygTpData(logs: ScraperLogHistorik[]): TpDatapunkt[] {
  return logs
    .filter((l) => l.scraperId === 'tp-detaljer')
    .map((log, i) => {
      const match = log.resultat?.match as Record<string, number> | undefined;
      return {
        kørsel: `#${i + 1}`,
        matchet: match?.matchet ?? 0,
        ingenMatch: match?.ingenMatch ?? 0,
      };
    });
}

const TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: 12,
};

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

  const totalBehandlet = logs.reduce((s, l) => s + ((l.resultat?.behandlet as number) ?? 0), 0);
  const successRate = logs.length > 0 ? Math.round((logs.filter((l) => l.ok).length / logs.length) * 100) : 0;
  const seneste = logs.at(-1);

  const aktivitetData = bygAktivitetData(logs);
  const fundItemData = bygFundItemData(logs);
  const tpData = bygTpData(logs);

  const unikkeScrapere = [...new Set(logs.map((l) => l.scraperId))];

  return (
    <section className="scraper-historik">
      <div className="scraper-historik-header">
        <h2 className="scraper-historik-titel">Kørselsoversigt</h2>
        <p className="scraper-historik-sub">Historik over alle automatiske og manuelle kørsleri</p>
      </div>

      <div className="scraper-historik-stats">
        <div className="scraper-historik-stat">
          <span className="scraper-historik-stat-tal">{logs.length}</span>
          <span className="scraper-historik-stat-label">Kørsler i alt</span>
        </div>
        <div className="scraper-historik-stat">
          <span className="scraper-historik-stat-tal">{totalBehandlet.toLocaleString('da-DK')}</span>
          <span className="scraper-historik-stat-label">Rækker behandlet</span>
        </div>
        <div className="scraper-historik-stat">
          <span className={`scraper-historik-stat-tal ${successRate === 100 ? 'ok' : 'advarsel'}`}>
            {successRate}%
          </span>
          <span className="scraper-historik-stat-label">Succesrate</span>
        </div>
        <div className="scraper-historik-stat">
          <span className="scraper-historik-stat-tal scraper-historik-stat-dato">
            {seneste ? formatKort(seneste.kørtKl) : '—'}
          </span>
          <span className="scraper-historik-stat-label">Seneste kørsel</span>
        </div>
      </div>

      <div className="scraper-historik-kort">
        <div className="scraper-historik-kort-header">
          <p className="scraper-historik-kort-titel">Behandlede rækker pr. kørsel</p>
          <p className="scraper-historik-kort-sub">Hver søjle = én kørsel, farve = scraper-type</p>
        </div>
        <div className="scraper-historik-legender">
          {unikkeScrapere.map((sid) => (
            <span key={sid} className="scraper-historik-legend-item">
              <span className="scraper-historik-legend-dot" style={{ background: SCRAPER_FARVER[sid] ?? '#999' }} />
              {SCRAPER_LABELS[sid] ?? sid}
            </span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={aktivitetData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="tid" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as AktivitetDatapunkt;
                return (
                  <div style={{ ...TOOLTIP_STYLE, padding: '8px 12px' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 11 }}>{d.tidFull}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6B7280' }}>
                      {SCRAPER_LABELS[d.scraper] ?? d.scraper}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12 }}>
                      {d.behandlet} rækker · {d.ok ? '✓ OK' : '✗ Fejl'}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="behandlet" radius={[3, 3, 0, 0]}>
              {aktivitetData.map((entry, i) => (
                <Cell key={i} fill={SCRAPER_FARVER[entry.scraper] ?? '#6366F1'} opacity={entry.ok ? 1 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="scraper-historik-grid">
        {fundItemData.length > 0 && (
          <div className="scraper-historik-kort">
            <div className="scraper-historik-kort-header">
              <p className="scraper-historik-kort-titel">STPS fund-items — fundet pr. kørsel</p>
              <p className="scraper-historik-kort-sub">Strukturerede målepunkter udtrukket fra PDF</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={fundItemData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="kørsel" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={(val, name) => {
                    const labels: Record<string, string> = { fundet: 'Fund-items fundet', ingenItems: 'Ingen items', behandlet: 'Behandlet' };
                    return [val, labels[String(name)] ?? String(name)];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }}
                  formatter={(val) => {
                    const labels: Record<string, string> = { fundet: 'Fund-items fundet', ingenItems: 'Ingen items' };
                    return labels[String(val)] ?? String(val);
                  }}
                />
                <Bar dataKey="fundet" fill="#A855F7" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ingenItems" fill="#E5E7EB" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tpData.length > 0 && (
          <div className="scraper-historik-kort">
            <div className="scraper-historik-kort-header">
              <p className="scraper-historik-kort-titel">Tilbudsportalen — matchstatus</p>
              <p className="scraper-historik-kort-sub">Akkumuleret matchet vs. ikke-matchet over kørsler</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={tpData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="kørsel" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} interval={Math.floor(tpData.length / 6)} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={(val, name) => {
                    const labels: Record<string, string> = { matchet: 'Matchet', ingenMatch: 'Ingen match' };
                    return [val, labels[String(name)] ?? String(name)];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }}
                  formatter={(val) => {
                    const labels: Record<string, string> = { matchet: 'Matchet', ingenMatch: 'Ingen match' };
                    return labels[String(val)] ?? String(val);
                  }}
                />
                <Line type="monotone" dataKey="matchet" stroke="#0EA5E9" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ingenMatch" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
