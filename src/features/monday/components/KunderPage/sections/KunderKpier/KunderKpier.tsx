'use client';

import type { MondayKundeItem } from '@/features/monday/types/monday.types';

type Props = { kunder: MondayKundeItem[]; matchAntal?: number | null };

function beregnGnsLevetid(kunder: MondayKundeItem[]): string {
  const afsluttede = kunder.filter((k) => k.gruppe === 'afsluttet_forloeb' && k.oprettetDato && k.afsluttetDato);
  if (afsluttede.length === 0) return '—';
  const måneder = afsluttede.map((k) => {
    const fra = new Date(k.oprettetDato!);
    const til = new Date(k.afsluttetDato!);
    return Math.max(0, (til.getFullYear() - fra.getFullYear()) * 12 + (til.getMonth() - fra.getMonth()));
  });
  const gns = Math.round(måneder.reduce((a, b) => a + b, 0) / måneder.length);
  if (gns < 12) return `${gns} mdr.`;
  const år = Math.floor(gns / 12);
  const rest = gns % 12;
  return rest > 0 ? `${år} år ${rest} mdr.` : `${år} år`;
}

export function KunderKpier({ kunder, matchAntal }: Props) {
  const aktive = kunder.filter((k) => k.gruppe === 'aktive_forloeb').length;
  const nye = kunder.filter((k) => k.gruppe === 'nye_forloeb').length;
  const afsluttede = kunder.filter((k) => k.gruppe === 'afsluttet_forloeb').length;
  const total = kunder.length;

  const ansvarlige = new Set(kunder.map((k) => k.forløbsansvarlig).filter(Boolean)).size;
  const gnsLevetid = beregnGnsLevetid(kunder);

  const kpier = [
    { label: 'Aktive kunder', værdi: aktive, farve: 'var(--color-primary)', note: 'bostedkunder i aktivt forløb' },
    { label: 'Nye forløb', værdi: nye, farve: '#16a34a', note: 'nyopstartede forløb' },
    { label: 'Afsluttede', værdi: afsluttede, farve: 'var(--color-text-muted)', note: 'tidligere kunder' },
    { label: 'Gns. kundelevetid', værdi: gnsLevetid, farve: '#0369a1', note: 'fra oprettelse til afslutning' },
    { label: 'Forløbsansvarlige', værdi: ansvarlige, farve: '#7c3aed', note: 'medarbejdere med ansvar' },
    { label: 'Matchede bosteder', værdi: matchAntal ?? '…', farve: '#0369a1', note: 'bosteder matchet i systemet' },
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
