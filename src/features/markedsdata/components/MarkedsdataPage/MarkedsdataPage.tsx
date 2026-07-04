// src/features/markedsdata/components/MarkedsdataPage/MarkedsdataPage.tsx

import { Database, Info } from 'lucide-react';
import { KommuneBarChart } from './charts/KommuneBarChart';
import { ParagrafDonut } from './charts/ParagrafDonut';
import { InfoTooltip } from '@/features/markedsforing/components/shared/InfoTooltip';
import type { DstKommuneRå } from '@/lib/api/DstClient';

type Props = {
  data: DstKommuneRå[];
  antalBosteder: number;
};

export function MarkedsdataPage({ data, antalBosteder }: Props) {
  const totalBorgere = data.reduce((s, k) => s + k.total, 0);
  const totalP107 = data.reduce((s, k) => s + k.p107, 0);
  const totalP108 = data.reduce((s, k) => s + k.p108, 0);
  const størsteKommune = data[0];

  const kpis = [
    {
      label: 'Bosteder i Danmark',
      værdi: antalBosteder.toLocaleString('da-DK'),
forklaring: 'Antal §107/§108 afdelinger registreret på Tilbudsportalen. Tallet kan være højere end det reelle antal bosteder, fordi større organisationer med flere lokationer tæller som én afdeling pr. lokation.',
    },
    {
      label: 'Borgere i §107/§108 i alt',
      værdi: totalBorgere.toLocaleString('da-DK'),
      forklaring: 'Det samlede antal danskere der modtager ydelser i enten et midlertidigt (§107) eller længerevarende (§108) botilbud.',
    },
    {
      label: '§107 – Midlertidigt botilbud',
      værdi: totalP107.toLocaleString('da-DK'),
      forklaring: '§107 er midlertidigt ophold med støtte. Bruges typisk til personer i en overgangsperiode eller med midlertidigt behov for tæt støtte.',
    },
    {
      label: '§108 – Længerevarende botilbud',
      værdi: totalP108.toLocaleString('da-DK'),
      forklaring: '§108 er langvarigt botilbud til personer med betydelig og varigt nedsat fysisk eller psykisk funktionsevne.',
    },
    {
      label: 'Kommuner med data',
      værdi: `${data.length}`,
      forklaring: 'Antal kommuner der har indberettet data til Danmarks Statistik for seneste kvartal.',
    },
    {
      label: 'Størst marked',
      værdi: størsteKommune?.kommune ?? '—',
      forklaring: `${størsteKommune?.kommune} har flest borgere i §107/§108 botilbud med i alt ${størsteKommune?.total.toLocaleString('da-DK')} borgere.`,
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
            HAND01 · §107 og §108 botilbud · Antal borgere pr. kommune · Seneste kvartal
          </p>
        </div>
      </div>

      <div className="dst-info-boks">
        <Info size={14} className="dst-info-ikon" />
        <p>
          Data er hentet gratis fra Danmarks Statistiks åbne API og opdateres automatisk kvartalsvist.
          Tallene viser det samlede antal borgere der modtager botilbudsydelser — ikke antal pladser.
          Brug tallene som pejlemærke for markedsstørrelse pr. kommune.
        </p>
      </div>

      <div className="dst-kpis">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="dst-kpi-kort">
            <div className="dst-kpi-top">
              <span className="dst-kpi-label">{kpi.label}</span>
              <InfoTooltip tekst={kpi.forklaring} />
            </div>
            <div className="dst-kpi-tal">{kpi.værdi}</div>
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
