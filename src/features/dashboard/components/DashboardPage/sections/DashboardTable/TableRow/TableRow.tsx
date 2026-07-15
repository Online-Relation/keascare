// src/features/dashboard/components/DashboardPage/sections/DashboardTable/TableRow/TableRow.tsx

import Link from 'next/link';
import type { Bosted, StpsFundNiveau } from '@/features/dashboard/types/dashboard.types';
import { DataKvalitetBadge } from '@/features/dashboard/components/DataKvalitetBadge';

type TableRowProps = {
  bosted: Bosted;
};

const fundLabels: Record<StpsFundNiveau, string> = {
  kritisk: 'Kritiske fund',
  stoerre: 'Større fund',
  mindre:  'Mindre fund',
  ingen:   'Ingen fund',
  ukendt:  'Ukendt',
};

const fundBadgeKlasse: Record<StpsFundNiveau, string> = {
  kritisk: 'badge-kritisk',
  stoerre: 'badge-stoerre',
  mindre:  'badge-mindre',
  ingen:   'badge-ingen',
  ukendt:  'badge-ukendt',
};

export function TableRow({ bosted }: TableRowProps) {
  const dato = bosted.rapportDato
    ? new Date(bosted.rapportDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <tr>
      <td className="data-table td table-cell-bold">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href={`/dashboard/bosteder/${bosted.id}`}
            style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'var(--fw-medium)' }}
          >
            {bosted.navn}
          </Link>
          {bosted.erNy && (
            <span className="badge badge-kritisk btn-sm" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
              Ny
            </span>
          )}
        </div>
      </td>
      <td className="data-table td table-cell-muted">{bosted.region ?? '—'}</td>
      <td className="data-table td table-cell-muted">{bosted.tilsynsform ?? '—'}</td>
      <td className="data-table td">
        <span className={`badge ${fundBadgeKlasse[bosted.stpsFund]}`}>
          <span className="badge-dot" />
          {fundLabels[bosted.stpsFund]}
        </span>
      </td>
      <td className="data-table td table-cell-muted">{dato}</td>
      <td className="data-table td" style={{ maxWidth: '200px' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          {bosted.rapportFokus}
        </span>
      </td>
      <td className="data-table td">
        {bosted.mondayKunde === 'kunde' ? (
          <span className="badge badge-kunde" title={`Monday: ${bosted.mondayGruppe ?? ''}`}>
            <span className="badge-dot" />
            Kunde
          </span>
        ) : bosted.mondayKunde === 'tabt' ? (
          <span className="badge badge-ukendt" style={{ color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb' }} title="Har afvist kontakt med KeasCare">
            Afvist
          </span>
        ) : (
          <span className="badge badge-ukendt">—</span>
        )}
      </td>
      <td className="data-table td">
        <DataKvalitetBadge dataKvalitet={bosted.dataKvalitet} />
      </td>
    </tr>
  );
}
