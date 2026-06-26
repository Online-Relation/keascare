// src/features/rapporter/components/RapporterPage/RapporterPage.tsx

import Link from 'next/link';
import { AlertTriangle, AlertCircle, CheckCircle, ExternalLink, TrendingUp } from 'lucide-react';
import { FundTrendChart } from './charts/FundTrendChart';
import { KommuneFundChart } from './charts/KommuneFundChart';
import type { RapporterData } from '@/features/rapporter/types/rapporter.types';

const fundConfig = {
  kritisk: { label: 'Kritiske fund',   cls: 'badge-kritisk',  ikon: AlertTriangle },
  mindre:  { label: 'Mindre fund',     cls: 'badge-mindre',   ikon: AlertCircle },
  ingen:   { label: 'Ingen fund',      cls: 'badge-ingen',    ikon: CheckCircle },
  ukendt:  { label: 'Ukendt',          cls: 'badge-ukendt',   ikon: AlertCircle },
};

type Props = { data: RapporterData };

export function RapporterPage({ data }: Props) {
  const { kpis, trend, topKommuner, temaer, rapporter } = data;
  const maxTema = temaer[0]?.antal ?? 1;

  return (
    <div className="dashboard-content">

      <div className="rap-header">
        <div>
          <h1 className="rap-titel">Tilsynsrapporter</h1>
          <p className="rap-undertitel">Kritiske og markante STPS-fund · opdateres dagligt</p>
        </div>
        <div className="rap-total-badge">
          {rapporter.length} rapporter med fund
        </div>
      </div>

      {/* KPI-stribe */}
      <div className="rap-kpis">
        <div className="rap-kpi rap-kpi-kritisk">
          <AlertTriangle size={20} className="rap-kpi-ikon" />
          <div>
            <div className="rap-kpi-tal">{kpis.kritiske}</div>
            <div className="rap-kpi-label">Kritiske fund</div>
          </div>
          {kpis.kritiskeSidste30 > 0 && (
            <span className="rap-kpi-ny">{kpis.kritiskeSidste30} seneste 30 dage</span>
          )}
        </div>
        <div className="rap-kpi rap-kpi-mindre">
          <AlertCircle size={20} className="rap-kpi-ikon" />
          <div>
            <div className="rap-kpi-tal">{kpis.mindreOgStørre}</div>
            <div className="rap-kpi-label">Mindre fund</div>
          </div>
        </div>
        <div className="rap-kpi rap-kpi-ingen">
          <CheckCircle size={20} className="rap-kpi-ikon" />
          <div>
            <div className="rap-kpi-tal">{kpis.ingen}</div>
            <div className="rap-kpi-label">Ingen fund</div>
          </div>
        </div>
        <div className="rap-kpi rap-kpi-total">
          <TrendingUp size={20} className="rap-kpi-ikon" />
          <div>
            <div className="rap-kpi-tal">{kpis.total}</div>
            <div className="rap-kpi-label">Rapporter i alt</div>
          </div>
        </div>
      </div>

      {/* Trend + kommuner */}
      <div className="rap-chart-grid">

        <div className="rap-chart-kort rap-chart-bred">
          <div className="rap-chart-header">
            <div>
              <h2 className="rap-chart-titel">Udvikling over 12 måneder</h2>
              <p className="rap-chart-beskrivelse">
                Stablede søjler viser alle rapporter. Den røde linje viser kritiske fund — følg om kurven stiger.
              </p>
            </div>
          </div>
          <FundTrendChart data={trend} />
        </div>

        <div className="rap-chart-kort">
          <div className="rap-chart-header">
            <div>
              <h2 className="rap-chart-titel">Top 10 kommuner med fund</h2>
              <p className="rap-chart-beskrivelse">Kommuner med flest kritiske og mindre fund samlet</p>
            </div>
          </div>
          <KommuneFundChart data={topKommuner} />
        </div>

      </div>

      {/* Fokusområder — visuelt strip */}
      {temaer.length > 0 && (
        <div className="rap-temaer-kort">
          <div className="rap-chart-header">
            <div>
              <h2 className="rap-chart-titel">Hvad handler fundene om?</h2>
              <p className="rap-chart-beskrivelse">
                De hyppigst nævnte fokusområder i rapporter med kritiske og mindre fund
              </p>
            </div>
          </div>
          <div className="rap-temaer-liste">
            {temaer.map((t) => (
              <div key={t.tema} className="rap-tema-række">
                <div className="rap-tema-navn">{t.tema}</div>
                <div className="rap-tema-bar-wrap">
                  <div
                    className="rap-tema-bar"
                    style={{ width: `${Math.round((t.antal / maxTema) * 100)}%` }}
                  />
                </div>
                <div className="rap-tema-tal">
                  <strong>{t.antal}</strong>
                  <span className="rap-tema-pct"> ({t.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabel med kritiske + mindre */}
      <div className="dashboard-table-wrapper">
        <div className="dashboard-section-header">
          <span className="dashboard-section-title">Rapporter med kritiske og markante fund</span>
          <span className="rap-tabel-antal">{rapporter.length} rapporter</span>
        </div>
        <div className="rap-tabel-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bosted</th>
                <th>Kommune</th>
                <th>Fund</th>
                <th>Rapportdato</th>
                <th>Fokusområde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rapporter.map((r) => {
                const cfg = fundConfig[r.fundNiveau] ?? fundConfig.ukendt;
                const Ikon = cfg.ikon;
                return (
                  <tr key={r.id} className={r.fundNiveau === 'kritisk' ? 'rap-kritisk-række' : ''}>
                    <td>
                      <Link href={`/dashboard/bosteder/${r.id}`} className="rap-bosted-link">
                        {r.navn}
                      </Link>
                    </td>
                    <td className="table-cell-muted">{r.kommune?.replace(' Kommune', '') ?? '—'}</td>
                    <td>
                      <span className={`badge ${cfg.cls}`}>
                        <Ikon size={10} style={{ marginRight: '0.25rem', flexShrink: 0 }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="table-cell-muted" style={{ whiteSpace: 'nowrap' }}>
                      {r.rapportDato
                        ? new Date(r.rapportDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="table-cell-muted rap-tema-celle">
                      {r.temaer.slice(0, 2).join(', ') || '—'}
                    </td>
                    <td>
                      {r.rapportLink && (
                        <a href={r.rapportLink} target="_blank" rel="noopener noreferrer" className="rap-pdf-link" title="Åbn rapport (PDF)">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
