'use client';
// src/features/rapporter/components/RapporterPage/charts/KritiskePerMånedChart.tsx

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { MånedligKritisk } from '@/features/rapporter/types/rapporter.types';

type Props = { data: MånedligKritisk[] };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '0.5rem',
      padding: '0.6rem 0.875rem',
      fontSize: 'var(--text-xs)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>{label}</p>
      <p style={{ color: '#DC2626' }}>{val} kritiske rapporter</p>
    </div>
  );
}

export function KritiskePerMånedChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.kritisk), 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="måned"
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={24}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="kritisk" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.kritisk === 0 ? 'var(--color-border)' : entry.kritisk >= max * 0.7 ? '#DC2626' : '#F87171'}
            />
          ))}
        </Bar>
        <Line
          type="monotone"
          dataKey="kritiskLinje"
          stroke="#991B1B"
          strokeWidth={2}
          dot={false}
          strokeDasharray="4 3"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
