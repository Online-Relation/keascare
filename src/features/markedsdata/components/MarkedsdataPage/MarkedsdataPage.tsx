// src/features/markedsdata/components/MarkedsdataPage/MarkedsdataPage.tsx

import { Database, Info, Filter } from 'lucide-react';
import { KommuneBarChart } from './charts/KommuneBarChart';
import { ParagrafDonut } from './charts/ParagrafDonut';
import { InfoTooltip } from '@/features/markedsforing/components/shared/InfoTooltip';
import type { DstKommuneRå } from '@/lib/api/DstClient';

type Props = {
  data: DstKommuneRå[];
  antalBosteder: number;
  kvartal?: string | null;
  hentetKl?: string | null;
  visFilter?: string;
};

export function MarkedsdataPage({ data, antalBosteder, kvartal, hentetKl, visFilter }: Props) {
  const erFiltreret = visFilter === 'privat';
  const totalBorgere = data.reduce((s, k) => s + k.total, 0);
  const totalP107 = data.reduce((s, k) => s + k.p107, 0);
  const totalP108 = data.reduce((s, k) => s + k.p108, 0);
  const størsteKommune = data[0];

  const kpis = [
    {
      label: 'Bosteder i Danmark',
      værdi: antalBosteder.toLocaleString('da-DK'),
      forklaring: erFiltreret
        ? 'Viser kun private og selvejende §107/§108 afdelinger fra Tilbudsportalen — kommunale og regionale bosteder er fravalgt i dine indstillinger. Skift filter under Indstillinger for at se alle.'
        : 'Antal §107/§108 afdelinger registreret på Tilbudsportalen. Tallet kan være højere end det reelle antal bosteder, fordi større organisationer med flere lokationer tæller som én afdeling pr. lokation.',
      filtreret: true,
    },
    {
      label: 'Borgere i §107/§108 i alt',
      værdi: totalBorgere.toLocaleString('da-DK'),
      forklaring: 'Nationalt tal fra Danmarks Statistik — kan ikke filtreres på driftsform og viser altid alle borgere uanset dit filter.',
      filtreret: false,
    },
    {
      label: '§107 – Midlertidigt botilbud',
      værdi: totalP107.toLocaleString('da-DK'),
      forklaring: '§107 er midlertidigt ophold med støtte. Nationalt tal — ikke påvirket af driftsformfilter.',
      filtreret: false,
    },
    {
      label: '§108 – Længerevarende botilbud',
      værdi: totalP108.toLocaleString('da-DK'),
      forklaring: '§108 er langvarigt botilbud. Nationalt tal — ikke påvirket af driftsformfilter.',
      filtreret: false,
    },
    {
      label: 'Kommuner med data',
      værdi: `${data.length}`,
      forklaring: 'Antal kommuner der har indberettet data til Danmarks Statistik for seneste kvartal.',
      filtreret: false,
    },
    {
      label: 'Størst marked',
      værdi: størsteKommune?.kommune ?? '—',
      forklaring: `${størsteKommune?.kommune} har flest borgere i §107/§108 botilbud med i alt ${størsteKommune?.total.toLocaleString('da-DK')} borgere.`,
      filtreret: false,
    },
  ];

  return (
    <div className="dashboard-content">

      <div className="dst-header">
        <div className="dst-header-ikon">
          <Database size={22} />
        </div>
        <div>
          <h1 className="dst-titel">Markedsdata – Danmarks Statistik</h1>
          <p className="dst-undertitel">
            HAND01 · §107 og §108 botilbud · Antal borgere pr. kommune
            {kvartal ? ` · ${kvartal}` : ' · Seneste kvartal'}
            {hentetKl ? ` · Hentet ${new Date(hentetKl).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
          </p>
        </div>
      </div>

      <div className="dst-info-boks">
        <Info size={14} className="dst-info-ikon" />
        <p>
          Borgere-tallene er fra Danmarks Statistiks åbne API og opdateres kvartalsvist — de viser altid det nationale totalbillede uanset filter. Antal bosteder følger dit valgte driftsformfilter. Tallene viser borgere der modtager botilbudsydelser — ikke antal pladser.
        </p>
      </div>

      {erFiltreret && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.55rem 0.85rem',
          background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
          borderRadius: 8,
          fontSize: 'var(--text-xs)',
          color: 'var(--color-accent)',
        }}>
          <Filter size={13} style={{ flexShrink: 0 }} />
          <span>
            <strong>Filter aktivt:</strong> Viser kun private og selvejende bosteder. Borgere-tallene er nationale og påvirkes ikke af filteret. Skift under{' '}
            <a href="/dashboard/indstillinger" style={{ color: 'inherit', textDecoration: 'underline' }}>Indstillinger</a>.
          </span>
        </div>
      )}

      <div className="dst-kpis">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="dst-kpi-kort">
            <div className="dst-kpi-top">
              <span className="dst-kpi-label">{kpi.label}</span>
              <InfoTooltip tekst={kpi.forklaring} />
            </div>
            <div className="dst-kpi-tal">{kpi.værdi}</div>
            {erFiltreret && kpi.filtreret && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                <Filter size={10} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--color-accent)' }}>Kun privat/selvejende</span>
              </div>
            )}
            {!kpi.filtreret && kpi.label !== 'Kommuner med data' && kpi.label !== 'Størst marked' && (
              <div style={{ marginTop: '0.3rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Nationalt tal · alle driftsformer</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="dst-chart-grid">

        <div className="dst-chart-kort dst-chart-bred">
          <div className="dst-chart-header">
            <div>
              <h2 className="mf-chart-titel">Top 15 kommuner – §107 og §108 borgere</h2>
              <p className="mf-chart-beskrivelse">
                Sorteret efter samlet antal borgere i botilbud. Jo større kommune, desto større potentielt marked for KeasCare.
              </p>
            </div>
            <InfoTooltip tekst="Stablede søjler viser §108 (mørk) og §107 (lys). Kommuner med mange borgere har typisk også mange botilbud, dvs. potentielle KeasCare-kunder." />
          </div>
          <KommuneBarChart data={data} />
        </div>

        <div className="dst-chart-kort">
          <div className="dst-chart-header">
            <div>
              <h2 className="mf-chart-titel">§107 vs. §108 nationalt</h2>
              <p className="mf-chart-beskrivelse">Fordeling på tværs af alle 97 kommuner</p>
            </div>
            <InfoTooltip tekst="Nationalt har §107 (midlertidigt) og §108 (længerevarende) nogenlunde samme størrelse. §108-pladser er typisk dyrere og kræver mere støtte." />
          </div>
          <ParagrafDonut p107Total={totalP107} p108Total={totalP108} />
          <div className="dst-donut-tal">
            <div>
              <span className="dst-donut-pct">{Math.round((totalP107 / totalBorgere) * 100)}%</span>
              <span className="dst-donut-pct-label">§107</span>
            </div>
            <div className="dst-donut-divider" />
            <div>
              <span className="dst-donut-pct">{Math.round((totalP108 / totalBorgere) * 100)}%</span>
              <span className="dst-donut-pct-label">§108</span>
            </div>
          </div>
        </div>

      </div>

      <div className="dashboard-table-wrapper">
        <div className="dashboard-section-header">
          <span className="dashboard-section-title">Alle kommuner – rangeret efter markedsstørrelse</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Kommune</th>
              <th className="tal-kolonne">§107 borgere</th>
              <th className="tal-kolonne">§108 borgere</th>
              <th className="tal-kolonne">I alt</th>
              <th className="tal-kolonne">Andel af DK</th>
            </tr>
          </thead>
          <tbody>
            {data.map((k, i) => (
              <tr key={k.kommune}>
                <td className="table-cell-muted">{i + 1}</td>
                <td className="table-cell-bold">{k.kommune}</td>
                <td className="tal-kolonne table-cell-muted">{k.p107.toLocaleString('da-DK')}</td>
                <td className="tal-kolonne table-cell-muted">{k.p108.toLocaleString('da-DK')}</td>
                <td className="tal-kolonne">
                  <strong>{k.total.toLocaleString('da-DK')}</strong>
                </td>
                <td className="tal-kolonne">
                  <div className="dst-andel-celle">
                    <div className="stat-bar-track" style={{ flex: 1 }}>
                      <div
                        className="stat-bar-fill"
                        style={{ width: `${Math.round((k.total / totalBorgere) * 100 * 10)}%`, maxWidth: '100%' }}
                      />
                    </div>
                    <span className="dst-andel-pct">
                      {((k.total / totalBorgere) * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

    </div>
  );
}
