'use client';
// src/features/markedsdata/components/MarkedsdataPage/charts/ParagrafÅrBarChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
      fontSize: 'var(--text-xs)',
    }}>
      <p style={{ fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>{label}</p>
      <p style={{ color: '#2fb5a0' }}>§107 Midlertidigt: {p107.toLocaleString('da-DK')}</p>
      <p style={{ color: '#1d6fa0' }}>§108 Længerevarende: {p108.toLocaleString('da-DK')}</p>
      <p style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', marginTop: '0.375rem', paddingTop: '0.375rem' }}>
        I alt: {(p107 + p108).toLocaleString('da-DK')}
      </p>
    </div>
  );
}

export function ParagrafÅrBarChart({ data }: Props) {
  if (!data.length) return (
    <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
      Ingen historiske data tilgængelige
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: 16, height: 12, background: '#2fb5a0', borderRadius: 2, display: 'inline-block' }} />
          §107 Midlertidigt
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: 16, height: 12, background: '#1d6fa0', borderRadius: 2, display: 'inline-block' }} />
          §108 Længerevarende
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="år" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={36} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="p107" stackId="a" fill="#2fb5a0" radius={[0, 0, 0, 0]} />
          <Bar dataKey="p108" stackId="a" fill="#1d6fa0" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
