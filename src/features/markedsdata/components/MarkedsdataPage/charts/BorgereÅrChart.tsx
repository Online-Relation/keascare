'use client';
// src/features/markedsdata/components/MarkedsdataPage/charts/BorgereÅrChart.tsx

import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import type { DstÅrTotal } from '@/lib/api/DstClient';

type Props = { data: DstÅrTotal[] };

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p107 = payload.find((p) => p.dataKey === 'p107')?.value ?? 0;
  const p108 = payload.find((p) => p.dataKey === 'p108')?.value ?? 0;
  const prTusind = payload.find((p) => p.dataKey === 'prTusind')?.value;
  const befolkning = payload.find((p) => p.dataKey === 'befolkning')?.value;

  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontSize: 'var(--text-xs)',
      minWidth: '200px',
    }}>
      <p style={{ fontWeight: 'var(--fw-semibold)', marginBottom: '0.375rem', color: 'var(--color-text-primary)' }}>{label}</p>
      <p style={{ color: '#2fb5a0' }}>§107 Midlertidigt: {p107.toLocaleString('da-DK')}</p>
      <p style={{ color: '#1d6fa0' }}>§108 Længerevarende: {p108.toLocaleString('da-DK')}</p>
      <p style={{ color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', marginTop: '0.375rem', paddingTop: '0.375rem' }}>
        I alt: {(p107 + p108).toLocaleString('da-DK')} borgere
      </p>
      {befolkning && (
        <p style={{ color: 'var(--color-text-muted)' }}>
          Befolkning: {befolkning.toLocaleString('da-DK')}
        </p>
      )}
      {prTusind !== undefined && (
        <p style={{ color: '#9333ea', fontWeight: 600 }}>
          Rate: {prTusind.toFixed(1)} pr. 1.000 indb.
        </p>
      )}
    </div>
  );
}

export function BorgereÅrChart({ data }: Props) {
  if (!data.length) return (
    <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
      Ingen historiske data tilgængelige
    </div>
  );

  const harBefolkning = data.some((d) => d.prTusind !== undefined);
  const covidÅr = 2020;

  return (
    <div>
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: 24, height: 3, background: '#2fb5a0', borderRadius: 2, display: 'inline-block' }} />
          §107 Midlertidigt botilbud
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ width: 24, height: 3, background: '#1d6fa0', borderRadius: 2, display: 'inline-block' }} />
          §108 Længerevarende botilbud
        </span>
        {harBefolkning && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ width: 24, height: 0, borderTop: '2px dashed #9333ea', display: 'inline-block' }} />
            Rate pr. 1.000 indbyggere (højre akse)
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: harBefolkning ? 48 : 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="år"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="borgere"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            width={36}
          />
          {harBefolkning && (
            <YAxis
              yAxisId="rate"
              orientation="right"
              tick={{ fontSize: 11, fill: '#9333ea' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(1)}`}
              width={40}
              domain={['auto', 'auto']}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            yAxisId="borgere"
            x={covidÅr}
            stroke="var(--color-border)"
            strokeDasharray="4 4"
            label={{ value: 'COVID-19', position: 'insideTopRight', fontSize: 10, fill: 'var(--color-text-muted)' }}
          />
          <Line
            yAxisId="borgere"
            type="monotone"
            dataKey="p107"
            stroke="#2fb5a0"
            strokeWidth={2}
            dot={{ r: 4, fill: '#2fb5a0', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="borgere"
            type="monotone"
            dataKey="p108"
            stroke="#1d6fa0"
            strokeWidth={2}
            dot={{ r: 4, fill: '#1d6fa0', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          {harBefolkning && (
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="prTusind"
              stroke="#9333ea"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: '#9333ea', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {harBefolkning && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'var(--color-surface)',
          borderLeft: '3px solid #9333ea',
          borderRadius: '0 0.375rem 0.375rem 0',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Hvad viser den lilla linje?</span>
          {' '}Den viser antallet af borgere i §107/§108 botilbud pr. 1.000 danskere. Fra 2016 til 2024 er raten steget fra ca. 1,6 til 2,0 — en stigning på over 25 % — mens Danmarks befolkning kun er vokset ca. 5 % i samme periode.{' '}
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Behovet for botilbud vokser altså markant hurtigere end befolkningen.</span>
          {' '}Den kraftigste stigning skete fra 2017 til 2020, hvorefter niveauet har holdt sig stabilt på ~2,0 pr. 1.000.
          <span style={{ display: 'block', marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>
            Kilde: DST · HAND01 (borgere) + FOLK1A (folketal pr. 1. januar)
          </span>
        </div>
      )}
    </div>
  );
}
