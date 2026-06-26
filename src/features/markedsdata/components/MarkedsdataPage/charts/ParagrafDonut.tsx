// src/features/markedsdata/components/MarkedsdataPage/charts/ParagrafDonut.tsx

'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Props = {
  p107Total: number;
  p108Total: number;
};

export function ParagrafDonut({ p107Total, p108Total }: Props) {
  const data = [
    { navn: '§107 Midlertidigt', værdi: p107Total, farve: '#818CF8' },
    { navn: '§108 Længerevarende', værdi: p108Total, farve: '#6366F1' },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          dataKey="værdi"
          nameKey="navn"
          paddingAngle={4}
        >
          {data.map((seg) => (
            <Cell key={seg.navn} fill={seg.farve} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }}
          formatter={(val) => [Number(val).toLocaleString('da-DK'), 'Borgere']}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(val) => val} />
      </PieChart>
    </ResponsiveContainer>
  );
}
