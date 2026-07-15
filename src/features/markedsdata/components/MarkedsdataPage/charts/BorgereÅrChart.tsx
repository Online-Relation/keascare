'use client';
// src/features/markedsdata/components/MarkedsdataPage/charts/BorgereÅrChart.tsx

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { DstÅrTotal } from '@/lib/api/DstClient';

type Props = { data: DstÅrTotal[] };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p107 = payload.find((p) => p.dataKey === 'p107')?.value ?? 0;
  const p108 = payload.find((p) => p.dataKey === 'p108')?.value ?? 0;
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontSize: 'var(--text-xs)',
    }}>
      <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>{label}</p>
      <p style={{ color: '#2fb5a0' }}>§107 Midlertidigt: {p107.toLocaleString('da-DK')}</p>
      <p style={{ color: '#1d6fa0' }}>§108 Længerevarende: {p108.toLocaleString('da-DK')}</p>
      <p style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', marginTop: '0.375rem', paddingTop: '0.375rem' }}>
        I alt: {(p107 + p108).toLocaleString('da-DK')} borgere
      </p>
    </div>
  );
}

export function BorgereÅrChart({ data }: Props) {
  if (!data.length) return (
    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
      Ingen historiske data tilgængelige
    </div>
  );

  const covidÅr = 2020;

  return (
    <div>
      {/* Legende */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: 24, height: 3, background: '#2fb5a0', borderRadius: 2, display: 'inline-block' }} />
          §107 Midlertidigt botilbud
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: 24, height: 3, background: '#1d6fa0', borderRadius: 2, display: 'inline-block' }} />
          §108 Længerevarende botilbud
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="år"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={covidÅr}
            stroke="var(--color-border)"
            strokeDasharray="4 4"
            label={{ value: 'COVID-19', position: 'insideTopRight', fontSize: 10, fill: 'var(--color-text-muted)' }}
          />
          <Line
            type="monotone"
            dataKey="p107"
            stroke="#2fb5a0"
            strokeWidth={2}
            dot={{ r: 4, fill: '#2fb5a0', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="p108"
            stroke="#1d6fa0"
            strokeWidth={2}
            dot={{ r: 4, fill: '#1d6fa0', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
