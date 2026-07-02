// src/features/markedspotentiale/components/MarkedspotentialePage/MarkedspotentialePage.tsx

import { Target } from 'lucide-react';
import type { SalgsFunnel } from '@/features/dashboard/types/dashboard.types';
import type { DstKommuneRå } from '@/lib/api/DstClient';
import { SalgstragtKlient } from './SalgstragtKlient';
import { PipelineStats } from './PipelineStats';

type Props = {
  funnel: SalgsFunnel;
  dstData: DstKommuneRå[];
  fra?: string;
  til?: string;
};

export function MarkedspotentialePage({ funnel, dstData, fra, til }: Props) {
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
            Tryk på et trin for at se hvilke bosteder der er i det — og gå videre ind på hvert bosted.
          </p>
        </div>

        <SalgstragtKlient funnel={funnel} fra={fra} til={til} />
      </div>

      <PipelineStats />

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
