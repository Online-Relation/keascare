// src/features/rapporter/components/RapporterPage/charts/KommuneFundChart.tsx

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { KommuneFundStat } from '@/features/rapporter/types/rapporter.types';

type Props = { data: KommuneFundStat[] };

export function KommuneFundChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="kommune"
          tick={{ fontSize: 10, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
          width={130}
          tickFormatter={(v: string) => v.replace(' Kommune', '')}
        />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
          formatter={(val, name) => [val, name === 'kritisk' ? 'Kritiske fund' : 'Mindre fund']}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(val) => val === 'kritisk' ? 'Kritiske' : 'Mindre'}
        />
        <Bar dataKey="mindre" stackId="a" fill="#FCD34D" />
        <Bar dataKey="kritisk" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
