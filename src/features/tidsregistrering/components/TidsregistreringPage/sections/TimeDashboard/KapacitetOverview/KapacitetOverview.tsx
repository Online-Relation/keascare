'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/KapacitetOverview/KapacitetOverview.tsx

import { formatMin } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { Periode } from '@/features/tidsregistrering/types/tidsregistrering.types';

const TIMER_PR_ARBEJDSDAG = 7.4;

function getMålMinutter(periode: Periode, arbejdsdage: number): number {
  if (periode === 'dette-aar') return 1760 * 60;
  return Math.round(arbejdsdage * TIMER_PR_ARBEJDSDAG * 60);
}

type Props = { totalMinutter: number; antalArbejdsdage: number; periode: Periode };

const R = 56;
const CIRC = 2 * Math.PI * R;

export function KapacitetOverview({ totalMinutter, antalArbejdsdage, periode }: Props) {
  const målMin = getMålMinutter(periode, antalArbejdsdage);
  const pct = målMin > 0 ? Math.min(totalMinutter / målMin, 1) : 0;
  const restMin = Math.max(målMin - totalMinutter, 0);
  const dashOffset = CIRC * (1 - pct);
  const pctVis = Math.round(pct * 100);

  const farve = pct >= 1 ? '#059669' : pct >= 0.7 ? '#4f46e5' : '#d97706';

  return (
    <div className="tr-dash-sektion tr-dash-kapacitet">
      <h2 className="tr-dash-sektion-titel">Kapacitet</h2>
      <div className="tr-dash-kapacitet-indhold">
        <div className="tr-dash-kapacitet-gauge">
          <svg viewBox="0 0 130 130" width={130} height={130}>
            <circle cx={65} cy={65} r={R} fill="none" stroke="var(--color-border)" strokeWidth={10} />
            <circle
              cx={65} cy={65} r={R}
              fill="none"
              stroke={farve}
              strokeWidth={10}
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text x={65} y={60} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--color-text-primary)" fontFamily="inherit">
              {pctVis}%
            </text>
            <text x={65} y={76} textAnchor="middle" fontSize={11} fill="var(--color-text-muted)" fontFamily="inherit">
              udnyttet
            </text>
          </svg>
        </div>

        <div className="tr-dash-kapacitet-tal">
          <div className="tr-dash-kap-rad">
            <span className="tr-dash-kap-label">Mulig arbejdstid</span>
            <span className="tr-dash-kap-værdi">{formatMin(målMin)}</span>
          </div>
          <div className="tr-dash-kap-rad">
            <span className="tr-dash-kap-label">Registreret tid</span>
            <span className="tr-dash-kap-værdi" style={{ color: farve }}>{formatMin(totalMinutter)}</span>
          </div>
          <div className="tr-dash-kap-rad">
            <span className="tr-dash-kap-label">Rest tid</span>
            <span className="tr-dash-kap-værdi">{formatMin(restMin)}</span>
          </div>
          <div className="tr-dash-kap-rad">
            <span className="tr-dash-kap-label">Arbejdsdage</span>
            <span className="tr-dash-kap-værdi">{antalArbejdsdage}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
