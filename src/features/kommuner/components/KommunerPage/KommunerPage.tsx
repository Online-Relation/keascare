// src/features/kommuner/components/KommunerPage/KommunerPage.tsx

import Link from 'next/link';
import { MapPin, Users } from 'lucide-react';
import type { KommuneOversigt } from '@/features/kommuner/types/kommuner.types';

type Props = {
  kommuner: KommuneOversigt[];
};

export function KommunerPage({ kommuner }: Props) {
  const totalBorgere = kommuner.reduce((sum, k) => sum + k.totalBorgere, 0);
  const medBosteder = kommuner.filter((k) => k.antalBosteder > 0).length;

  return (
    <div className="dashboard-content">
      <div className="kommuner-header">
        <div>
          <h1 className="kommuner-titel">Kommuner</h1>
          <p className="kommuner-undertitel">
            §107/§108 markedsdata fra Danmarks Statistik · opdateres kvartalsvist
          </p>
        </div>
        <div className="kommuner-kpi-mini">
          <div className="kommuner-kpi-mini-item">
            <span className="kommuner-kpi-mini-tal">{kommuner.length}</span>
            <span className="kommuner-kpi-mini-label">kommuner</span>
          </div>
          <div className="kommuner-kpi-mini-item">
            <span className="kommuner-kpi-mini-tal">{totalBorgere.toLocaleString('da-DK')}</span>
            <span className="kommuner-kpi-mini-label">borgere i alt</span>
          </div>
          <div className="kommuner-kpi-mini-item">
            <span className="kommuner-kpi-mini-tal">{medBosteder}</span>
            <span className="kommuner-kpi-mini-label">med bosteder i DB</span>
          </div>
        </div>
      </div>

      <div className="dashboard-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kommune</th>
              <th className="tal-kolonne">§107 borgere</th>
              <th className="tal-kolonne">§108 borgere</th>
              <th className="tal-kolonne">I alt</th>
              <th className="tal-kolonne">Bosteder i DB</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {kommuner.map((k) => (
              <tr key={k.navn}>
                <td>
                  <div className="kommuner-navn-celle">
                    <MapPin size={13} className="kommuner-pin-ikon" />
                    {k.navn}
                  </div>
                </td>
                <td className="tal-kolonne table-cell-muted">{k.p107.toLocaleString('da-DK')}</td>
                <td className="tal-kolonne table-cell-muted">{k.p108.toLocaleString('da-DK')}</td>
                <td className="tal-kolonne">
                  <span className="kommuner-total-tal">{k.totalBorgere.toLocaleString('da-DK')}</span>
                </td>
                <td className="tal-kolonne">
                  {k.antalBosteder > 0 ? (
                    <span className="kommuner-bosteder-badge">{k.antalBosteder}</span>
                  ) : (
                    <span className="table-cell-muted">—</span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/dashboard/kommuner/${encodeURIComponent(k.navn)}`}
                    className="kommuner-se-link"
                  >
                    <Users size={13} />
                    Se bosteder
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
