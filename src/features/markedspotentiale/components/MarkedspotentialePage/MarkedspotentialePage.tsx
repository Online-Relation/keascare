// src/features/markedspotentiale/components/MarkedspotentialePage/MarkedspotentialePage.tsx

import { Target } from 'lucide-react';
import type { SalgsFunnel } from '@/features/dashboard/types/dashboard.types';
import type { DstKommuneRå } from '@/lib/api/DstClient';

type Props = {
  funnel: SalgsFunnel;
  dstData: DstKommuneRå[];
};

const TRIN_FARVER = [
  { bg: '#f0f9ff', border: '#bae6fd', tekst: '#0369a1', bar: '#0ea5e9' },
  { bg: '#fef9c3', border: '#fde68a', tekst: '#92400e', bar: '#f59e0b' },
  { bg: '#ffedd5', border: '#fed7aa', tekst: '#c2410c', bar: '#f97316' },
  { bg: '#fee2e2', border: '#fecaca', tekst: '#b91c1c', bar: '#ef4444' },
  { bg: '#dcfce7', border: '#bbf7d0', tekst: '#15803d', bar: '#22c55e' },
];

export function MarkedspotentialePage({ funnel, dstData }: Props) {
  const totalBorgere = dstData.reduce((s, k) => s + k.total, 0);
  const ikkeBearbejdet = funnel.trin[2]?.antal ?? 0;
  const kunder = funnel.trin[3]?.antal ?? 0;
  const medFund = funnel.trin[0]?.antal ?? 0;
  const konverteringsPct = medFund > 0 ? ((kunder / medFund) * 100).toFixed(1) : '0';

  return (
    <div className="dashboard-content">

      <div className="dst-header">
        <div className="dst-header-ikon">
          <Target size={22} />
        </div>
        <div>
          <h1 className="dst-titel">Markedspotentiale</h1>
          <p className="dst-undertitel">
            Salgstragt · Baseret på STPS-tilsynsrapporter og Monday CRM · Følger dato- og driftsform-filter
          </p>
        </div>
      </div>

      <div className="mp-kpi-grid">
        <div className="dst-kpi-kort">
          <div className="dst-kpi-top">
            <span className="dst-kpi-label">Ubearbejdede leads</span>
          </div>
          <div className="dst-kpi-tal" style={{ color: '#b91c1c' }}>{ikkeBearbejdet}</div>
          <div className="mp-kpi-sub">Kritisk/større fund — ikke kunder endnu</div>
        </div>
        <div className="dst-kpi-kort">
          <div className="dst-kpi-top">
            <span className="dst-kpi-label">Kunder i Monday</span>
          </div>
          <div className="dst-kpi-tal" style={{ color: '#15803d' }}>{kunder}</div>
          <div className="mp-kpi-sub">Matchede aktive forløb</div>
        </div>
        <div className="dst-kpi-kort">
          <div className="dst-kpi-top">
            <span className="dst-kpi-label">Konvertering</span>
          </div>
          <div className="dst-kpi-tal">{konverteringsPct}%</div>
          <div className="mp-kpi-sub">Kunder ud af alle bosteder i udsnit</div>
        </div>
        <div className="dst-kpi-kort">
          <div className="dst-kpi-top">
            <span className="dst-kpi-label">Borgere i §107/§108</span>
          </div>
          <div className="dst-kpi-tal">{totalBorgere.toLocaleString('da-DK')}</div>
          <div className="mp-kpi-sub">Samlet markedsstørrelse (DST)</div>
        </div>
      </div>

      <div className="mp-funnel-wrapper">
        <div className="mp-funnel-header">
          <h2 className="mf-chart-titel">Salgstragt</h2>
          <p className="mf-chart-beskrivelse">
            Hvert trin viser andelen af bosteder der falder i den kategori — og hvor mange der videreføres til næste trin.
          </p>
        </div>

        <div className="mp-funnel-trin-liste">
          {funnel.trin.map((trin, i) => {
            const n = funnel.trin.length;
            // Tragt: trin 0 = 100%, sidste trin = 40%, jævnt fordelt
            const tragPct = 100 - (i / Math.max(n - 1, 1)) * 60;
            const farve = TRIN_FARVER[i] ?? TRIN_FARVER[0];
            const næste = funnel.trin[i + 1];
            const konvPct = næste && trin.antal > 0
              ? Math.round((næste.antal / trin.antal) * 100)
              : null;

            return (
              <div key={trin.label} className="mp-funnel-trin-wrapper">
                <div
                  className="mp-funnel-trin"
                  style={{
                    borderColor: farve.border,
                    backgroundColor: farve.bg,
                    width: `${tragPct}%`,
                  }}
                >
                  <div className="mp-funnel-trin-indhold">
                    <div className="mp-funnel-trin-venstre">
                      <span className="mp-funnel-trin-num" style={{ color: farve.tekst }}>{i + 1}</span>
                      <div>
                        <div className="mp-funnel-trin-label">{trin.label}</div>
                        <div className="mp-funnel-trin-beskrivelse">{trin.beskrivelse}</div>
                      </div>
                    </div>
                    <div className="mp-funnel-trin-antal" style={{ color: farve.tekst }}>
                      {trin.antal.toLocaleString('da-DK')}
                    </div>
                  </div>
                </div>
                {konvPct !== null && (
                  <div className="mp-funnel-pil">
                    ↓ {konvPct}% videre
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="dst-info-boks">
        <p>
          Tallene i salgstragten følger det valgte datointerval og driftsform-filter (alle / kun private).
          Kunder er bosteder matchet med aktive forløb i Monday CRM.
          Markedsstørrelsen fra DST er det samlede antal borgere i §107/§108 botilbud på tværs af alle kommuner.
        </p>
      </div>

    </div>
  );
}
