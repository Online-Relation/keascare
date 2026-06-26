// src/features/kommuner/components/KommuneDetailPage/KommuneDetailPage.tsx

import Link from 'next/link';
import { ChevronLeft, MapPin, ExternalLink } from 'lucide-react';
import type { KommuneDetail } from '@/features/kommuner/types/kommuner.types';

const fundLabels: Record<string, string> = {
  kritisk: 'Kritiske fund',
  stoerre: 'Større fund',
  større:  'Større fund',
  mindre:  'Mindre fund',
  ingen:   'Ingen fund',
  ukendt:  'Ukendt',
};

type Props = {
  detail: KommuneDetail;
};

export function KommuneDetailPage({ detail }: Props) {
  return (
    <div className="dashboard-content">
      <Link href="/dashboard/kommuner" className="bosted-tilbage-link">
        <ChevronLeft size={16} />
        Alle kommuner
      </Link>

      <div className="kommune-detail-header">
        <div className="kommune-detail-titel-række">
          <MapPin size={20} className="kommune-detail-pin" />
          <h1 className="kommune-detail-titel">{detail.navn} Kommune</h1>
        </div>

        <div className="kommune-detail-stats">
          <div className="kommune-stat-kort">
            <span className="kommune-stat-tal">{detail.p107.toLocaleString('da-DK')}</span>
            <span className="kommune-stat-label">§107 borgere</span>
            <span className="kommune-stat-sub">Midlertidigt botilbud</span>
          </div>
          <div className="kommune-stat-kort">
            <span className="kommune-stat-tal">{detail.p108.toLocaleString('da-DK')}</span>
            <span className="kommune-stat-label">§108 borgere</span>
            <span className="kommune-stat-sub">Længerevarende botilbud</span>
          </div>
          <div className="kommune-stat-kort kommune-stat-kort-total">
            <span className="kommune-stat-tal">{detail.totalBorgere.toLocaleString('da-DK')}</span>
            <span className="kommune-stat-label">I alt</span>
            <span className="kommune-stat-sub">Seneste kvartal, DST</span>
          </div>
          <div className="kommune-stat-kort">
            <span className="kommune-stat-tal">{detail.bosteder.length}</span>
            <span className="kommune-stat-label">Bosteder i DB</span>
            <span className="kommune-stat-sub">Med STPS-rapport</span>
          </div>
        </div>
      </div>

      {detail.bosteder.length === 0 ? (
        <div className="kommuner-ingen-bosteder">
          Ingen bosteder fundet i databasen for {detail.navn}.
        </div>
      ) : (
        <div className="dashboard-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bosted</th>
                <th>STPS fund</th>
                <th>Rapportdato</th>
                <th>Tilsynsform</th>
                <th>Temaer</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {detail.bosteder.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link href={`/dashboard/bosteder/${b.id}`} className="kommuner-bosted-link">
                      {b.navn}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge-${b.fundNiveau}`}>
                      <span className="badge-dot" />
                      {fundLabels[b.fundNiveau] ?? b.fundNiveau}
                    </span>
                  </td>
                  <td className="table-cell-muted">
                    {b.rapportDato
                      ? new Date(b.rapportDato).toLocaleDateString('da-DK', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="table-cell-muted">{b.tilsynsform ?? '—'}</td>
                  <td className="table-cell-muted">
                    {b.temaer.length > 0
                      ? b.temaer.slice(0, 2).join(', ') + (b.temaer.length > 2 ? '…' : '')
                      : '—'}
                  </td>
                  <td>
                    {b.rapportLink && (
                      <a
                        href={b.rapportLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="kommuner-rapport-link"
                        title="Åbn rapport"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
