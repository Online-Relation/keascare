// src/features/rapporter/components/RapporterPage/charts/FundTrendChart.tsx

'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { MånedligTrend } from '@/features/rapporter/types/rapporter.types';

type Props = { data: MånedligTrend[] };

export function FundTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="måned" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
          formatter={(val, name) => {
            const labels: Record<string, string> = { kritisk: 'Kritiske fund', mindre: 'Mindre fund', ingen: 'Ingen fund' };
            const key = String(name);
            return [val, labels[key] ?? key];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(val) => {
            const labels: Record<string, string> = { kritisk: 'Kritiske fund', mindre: 'Mindre fund', ingen: 'Ingen fund' };
            return labels[String(val)] ?? String(val);
          }}
        />
        <Bar dataKey="ingen" stackId="a" fill="#E5E7EB" radius={[0, 0, 0, 0]} />
        <Bar dataKey="mindre" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
        <Bar dataKey="kritisk" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="kritisk" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 3, fill: '#DC2626' }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
