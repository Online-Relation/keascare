// src/features/markedsdata/components/MarkedsdataPage/charts/KommuneBarChart.tsx

'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { DstKommuneRå } from '@/lib/api/DstClient';

type Props = { data: DstKommuneRå[] };

export function KommuneBarChart({ data }: Props) {
  const top15 = data.slice(0, 15);

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={top15} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="kommune" interval={0} tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} width={105} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
          formatter={(val, name) => [val, name === 'p107' ? '§107 borgere' : '§108 borgere']}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Legend
          formatter={(val) => val === 'p107' ? '§107 — Midlertidigt botilbud' : '§108 — Længerevarende botilbud'}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="p108" stackId="a" fill="#6366F1" radius={[0, 0, 0, 0]} />
        <Bar dataKey="p107" stackId="a" fill="#818CF8" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
