// src/features/rapporter/components/RapporterPage/RapporterPage.tsx

import { AlertTriangle, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { FundTrendChart } from './charts/FundTrendChart';
import { KommuneFundChart } from './charts/KommuneFundChart';
import { RapporterListeSektion } from './RapporterListeSektion';
import type { RapporterData } from '@/features/rapporter/types/rapporter.types';

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

      <RapporterListeSektion rapporter={rapporter} />

    </div>
  );
}
