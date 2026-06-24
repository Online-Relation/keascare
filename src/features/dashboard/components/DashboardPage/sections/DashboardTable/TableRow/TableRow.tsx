// src/features/dashboard/components/DashboardPage/sections/DashboardTable/TableRow/TableRow.tsx

import type { Bosted, StpsFundNiveau } from '@/features/dashboard/types/dashboard.types';
import { ExternalLink } from 'lucide-react';

type TableRowProps = {
  bosted: Bosted;
};

const fundLabels: Record<StpsFundNiveau, string> = {
  kritisk: 'Kritiske fund',
  større:  'Større fund',
  mindre:  'Mindre fund',
  ingen:   'Ingen fund',
  ukendt:  'Ukendt',
};

export function TableRow({ bosted }: TableRowProps) {
  return (
    <tr>
      <td className="data-table td table-cell-bold">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {bosted.navn}
          {bosted.erNy && (
            <span className="badge badge-kritisk btn-sm" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
              Ny
            </span>
          )}
        </div>
      </td>
      <td className="data-table td table-cell-muted">{bosted.kommune}</td>
      <td className="data-table td table-cell-muted">{bosted.pladser}</td>
      <td className="data-table td table-cell-muted">{bosted.drift}</td>
      <td className="data-table td">
        <span className={`badge badge-${bosted.stpsFund}`}>
          <span className="badge-dot" />
          {fundLabels[bosted.stpsFund]}
        </span>
      </td>
      <td className="data-table td table-cell-muted">{bosted.rapportDato}</td>
      <td className="data-table td" style={{ maxWidth: '200px' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          {bosted.rapportFokus}
        </span>
      </td>
      <td className="data-table td">
        <a
          href={bosted.rapportLink}
          className="btn btn-outline btn-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={12} />
          Se rapport
        </a>
      </td>
    </tr>
  );
}
