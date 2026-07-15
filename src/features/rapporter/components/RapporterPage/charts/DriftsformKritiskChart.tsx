'use client';
// src/features/rapporter/components/RapporterPage/charts/DriftsformKritiskChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { DriftsformKritiskStat } from '@/features/rapporter/types/rapporter.types';

type Props = { data: DriftsformKritiskStat[] };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: DriftsformKritiskStat }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      fontSize: 'var(--text-xs)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>{label}</p>
      <p style={{ color: '#DC2626' }}>Kritiske rapporter: {d.kritiske}</p>
      <p style={{ color: 'var(--color-text-muted)' }}>Rapporter i alt: {d.total}</p>
      <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '0.25rem' }}>
        {d.pct}% af gruppens rapporter er kritiske
      </p>
    </div>
  );
}

export function DriftsformKritiskChart({ data }: Props) {
  if (!data.length) return null;

  const FARVER = ['#2563EB', '#9333ea'];

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="navn"
            tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
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
          <Bar dataKey="kritiske" radius={[6, 6, 0, 0]} maxBarSize={80}>
            {data.map((_, i) => (
              <Cell key={i} fill={FARVER[i % FARVER.length]} />
            ))}
            <LabelList
              dataKey="pct"
              position="top"
              formatter={(v) => `${v}%`}
              style={{ fontSize: 12, fontWeight: 600, fill: 'var(--color-text-secondary)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Forklarende tabel under chart */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        {data.map((d, i) => (
          <div key={d.navn} style={{
            flex: 1,
            background: 'var(--color-surface)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            borderLeft: `3px solid ${FARVER[i % FARVER.length]}`,
          }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>{d.navn}</div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {d.kritiske} kritiske
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              ud af {d.total} rapporter · {d.pct}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
