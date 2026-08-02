'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/TimeUdviklingChart/TimeUdviklingChart.tsx

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMin } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { DagligData } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = { dagligData: DagligData[] };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.[0]) return null;
  const min = payload[0].value;
  return (
    <div className="tr-dash-tooltip">
      <div className="tr-dash-tooltip-navn">{label}</div>
      <div className="tr-dash-tooltip-tid">{min > 0 ? formatMin(min) : '0:00'}</div>
    </div>
  );
}

function minutterTilDecimal(min: number): number {
  return Math.round((min / 60) * 10) / 10;
}

function yAxisFormatter(val: number): string {
  if (val === 0) return '0';
  return `${val}t`;
}

export function TimeUdviklingChart({ dagligData }: Props) {
  const chartData = dagligData.map((d) => ({
    label: d.label,
    timer: minutterTilDecimal(d.minutter),
    minutter: d.minutter,
    antalRegistreringer: d.antalRegistreringer,
  }));

  const harData = dagligData.some((d) => d.minutter > 0);

  return (
    <div className="tr-dash-sektion">
      <h2 className="tr-dash-sektion-titel">Udvikling i timer</h2>
      {!harData ? (
        <p className="tr-dash-tom">Ingen registreringer i perioden.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="timer"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#trGradient)"
              dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#4f46e5' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
