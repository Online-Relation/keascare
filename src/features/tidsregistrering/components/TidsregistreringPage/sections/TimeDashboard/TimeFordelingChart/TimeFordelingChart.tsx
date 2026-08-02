'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/TimeFordelingChart/TimeFordelingChart.tsx

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMin, formatMinKort } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { KategoriFordeling } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = { fordeling: KategoriFordeling[]; totalMinutter: number };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: KategoriFordeling }[] }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="tr-dash-tooltip">
      <div className="tr-dash-tooltip-navn">{d.kategoriNavn}</div>
      <div className="tr-dash-tooltip-tid">{formatMin(d.minutter)} · {d.procentAndel}%</div>
    </div>
  );
}

export function TimeFordelingChart({ fordeling, totalMinutter }: Props) {
  if (fordeling.length === 0) {
    return (
      <div className="tr-dash-sektion">
        <h2 className="tr-dash-sektion-titel">Tidsfordeling</h2>
        <p className="tr-dash-tom">Ingen registreringer i perioden.</p>
      </div>
    );
  }

  return (
    <div className="tr-dash-sektion">
      <h2 className="tr-dash-sektion-titel">Tidsfordeling</h2>
      <div className="tr-dash-fordeling-indhold">
        <div className="tr-dash-donut-wrapper">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={fordeling}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={2}
                dataKey="minutter"
                nameKey="kategoriNavn"
              >
                {fordeling.map((entry) => (
                  <Cell key={entry.kategoriId} fill={entry.farve} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="tr-dash-donut-center">
            <div className="tr-dash-donut-total">{formatMin(totalMinutter)}</div>
            <div className="tr-dash-donut-label">timer</div>
          </div>
        </div>

        <div className="tr-dash-fordeling-liste">
          {fordeling.map((k) => (
            <div key={k.kategoriId} className="tr-dash-fordeling-rad">
              <span className="tr-dash-fordeling-farve" style={{ background: k.farve }} />
              <span className="tr-dash-fordeling-navn">{k.kategoriNavn}</span>
              <span className="tr-dash-fordeling-pct">{k.procentAndel}%</span>
              <span className="tr-dash-fordeling-tid">{formatMinKort(k.minutter)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
