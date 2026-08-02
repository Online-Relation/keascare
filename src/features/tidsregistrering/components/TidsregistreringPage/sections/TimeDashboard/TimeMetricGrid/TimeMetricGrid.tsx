'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/TimeMetricGrid/TimeMetricGrid.tsx

import { Clock, Calendar, BarChart2, Target, ListChecks, TrendingUp } from 'lucide-react';
import { formatMin } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { DashboardData, Periode } from '@/features/tidsregistrering/types/tidsregistrering.types';

const UGE_MÅL_MIN  = 37 * 60;
const MND_MÅL_MIN  = 160 * 60;
const AAR_MÅL_MIN  = 1760 * 60;

function getMål(periode: Periode, arbejdsdage: number): number | null {
  if (periode === 'denne-uge' || periode === 'sidste-uge') return UGE_MÅL_MIN;
  if (periode === 'denne-maaned' || periode === 'sidste-maaned') return MND_MÅL_MIN;
  if (periode === 'dette-aar') return AAR_MÅL_MIN;
  return null;
}

type Props = { data: DashboardData; periode: Periode };

export function TimeMetricGrid({ data, periode }: Props) {
  const mål = getMål(periode, data.antalArbejdsdage);
  const pct = mål ? Math.min(Math.round((data.totalMinutter / mål) * 100), 100) : null;

  const items = [
    {
      ikon: <Clock size={20} />,
      label: 'Registreret i perioden',
      værdi: data.totalMinutter > 0 ? formatMin(data.totalMinutter) : '0:00',
      sub: mål ? `Mål: ${formatMin(mål)} timer` : undefined,
      progress: pct,
      progressTekst: pct != null ? `${pct}%` : undefined,
    },
    {
      ikon: <Calendar size={20} />,
      label: 'Arbejdsdage i perioden',
      værdi: String(data.antalArbejdsdage),
      sub: data.antalRegistreringer > 0 ? `${data.antalRegistreringer} registreringer` : 'Ingen registreringer',
    },
    {
      ikon: <BarChart2 size={20} />,
      label: 'Kategorier brugt',
      værdi: String(data.fordeling.length),
      sub: data.fordeling[0] ? `Mest: ${data.fordeling[0].kategoriNavn}` : undefined,
    },
    {
      ikon: <Target size={20} />,
      label: 'Registreringsgrad',
      værdi: pct != null ? `${pct}%` : '—',
      sub: mål ? `Mål: 100% af ${formatMin(mål)}` : undefined,
      progress: pct,
    },
    {
      ikon: <ListChecks size={20} />,
      label: 'Unikke opgaver',
      værdi: String(data.topOpgaver.length > 0 ? data.fordeling.reduce((s, f) => s + 1, 0) : 0),
      sub: data.topOpgaver[0] ? `Top: ${data.topOpgaver[0].navn}` : undefined,
    },
    {
      ikon: <TrendingUp size={20} />,
      label: 'Gennemsnit pr. dag',
      værdi: data.antalArbejdsdage > 0 ? formatMin(data.gennemsnitPrDagMin) : '0:00',
      sub: 'timer pr. arbejdsdag',
    },
  ];

  return (
    <div className="tr-dash-metric-grid">
      {items.map((item) => (
        <div key={item.label} className="tr-dash-metric-kort">
          <div className="tr-dash-metric-top">
            <span className="tr-dash-metric-ikon">{item.ikon}</span>
            <span className="tr-dash-metric-label">{item.label}</span>
          </div>
          <div className="tr-dash-metric-værdi">{item.værdi}</div>
          {item.sub && <div className="tr-dash-metric-sub">{item.sub}</div>}
          {item.progress != null && (
            <div className="tr-dash-progress-bar">
              <div className="tr-dash-progress-fill" style={{ width: `${item.progress}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
