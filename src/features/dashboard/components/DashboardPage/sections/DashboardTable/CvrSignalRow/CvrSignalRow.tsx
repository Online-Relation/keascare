import type { CvrSignal } from '@/features/cvr/types/cvr.types';

type Props = { signal: CvrSignal };

export function CvrSignalRow({ signal }: Props) {
  const dato = signal.startdato
    ? new Date(signal.startdato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <tr>
      <td className="data-table td table-cell-bold">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--fw-medium)' }}>
            {signal.navn}
          </span>
          <span className="badge badge-info btn-sm" style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem', background: '#0ea5e9', color: '#fff' }}>
            Ny CVR
          </span>
        </div>
      </td>
      <td className="data-table td table-cell-muted">—</td>
      <td className="data-table td table-cell-muted">—</td>
      <td className="data-table td">
        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
          <span className="badge-dot" style={{ background: '#0369a1' }} />
          CVR {signal.branchekode}
        </span>
      </td>
      <td className="data-table td table-cell-muted">{dato}</td>
      <td className="data-table td" style={{ maxWidth: '200px' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          {signal.branchetekst}
        </span>
      </td>
      <td className="data-table td">
        {signal.mondayItemId ? (
          <span className="badge badge-kunde">
            <span className="badge-dot" />
            Kunde
          </span>
        ) : (
          <span className="badge badge-ukendt">—</span>
        )}
      </td>
      <td className="data-table td table-cell-muted">—</td>
    </tr>
  );
}
