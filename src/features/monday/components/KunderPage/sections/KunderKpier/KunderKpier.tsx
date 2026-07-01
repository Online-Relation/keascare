'use client';

import type { MondayKundeItem } from '@/features/monday/types/monday.types';

type Props = { kunder: MondayKundeItem[] };

export function KunderKpier({ kunder }: Props) {
  const aktive = kunder.filter((k) => k.gruppe === 'aktive_forloeb').length;
  const nye = kunder.filter((k) => k.gruppe === 'nye_forloeb').length;
  const total = kunder.length;

  const ansvarlige = new Set(kunder.map((k) => k.forløbsansvarlig).filter(Boolean)).size;

  const kpier = [
    { label: 'Aktive kunder', værdi: aktive, farve: 'var(--color-primary)', note: 'bostedkunder i aktivt forløb' },
    { label: 'Nye forløb', værdi: nye, farve: '#16a34a', note: 'nyopstartede forløb' },
    { label: 'Kunder i alt', værdi: total, farve: 'var(--color-text-primary)', note: 'Type=Bosted i Monday' },
    { label: 'Forløbsansvarlige', værdi: ansvarlige, farve: '#7c3aed', note: 'medarbejdere med ansvar' },
  ];

  return (
    <div className="kunder-kpi-grid">
      {kpier.map(({ label, værdi, farve, note }) => (
        <div key={label} className="bosted-detail-kort kunder-kpi-kort">
          <p className="kunder-kpi-label">{label}</p>
          <p className="kunder-kpi-tal" style={{ color: farve }}>{værdi}</p>
          <p className="kunder-kpi-note">{note}</p>
        </div>
      ))}
    </div>
  );
}
