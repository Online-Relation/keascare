'use client';

// src/features/kommuner/components/KommuneDetailPage/KommuneDetailPage.tsx

import Link from 'next/link';
import { MapPin, ExternalLink, Users, AlertTriangle, Building2, Calendar } from 'lucide-react';
import { InspektoerAvatar } from '@/features/stps/components/InspektoerSide/InspektoerAvatar';
import type { KommuneDetail } from '@/features/kommuner/types/kommuner.types';

const FUND_LABELS: Record<string, string> = {
  kritisk: 'Kritiske fund',
  større:  'Større fund',
  stoerre: 'Større fund',
  mindre:  'Mindre fund',
  ingen:   'Ingen fund',
  ukendt:  'Ukendt',
};

const FUND_BAR_COLOR: Record<string, string> = {
  kritisk: '#dc2626',
  større:  '#f97316',
  stoerre: '#f97316',
  mindre:  '#eab308',
  ingen:   '#16a34a',
  ukendt:  '#94a3b8',
};

type Props = { detail: KommuneDetail };

export function KommuneDetailPage({ detail }: Props) {
  const kortNavn = detail.navn.replace(/\s+[Kk]ommune$/, '');
  const totalBosteder = detail.bosteder.length;
  const maxFund = Math.max(...detail.fundFordeling.map((f) => f.antal), 1);

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div className="kommune-detail-header">
        <div className="kommune-detail-titel-række">
          <MapPin size={20} className="kommune-detail-pin" />
          <h1 className="kommune-detail-titel">{kortNavn} Kommune</h1>
        </div>

        <div className="kommune-detail-stats">
          <div className="kommune-stat-kort">
            <Building2 size={16} className="kommune-stat-ikon" />
            <span className="kommune-stat-tal">{totalBosteder}</span>
            <span className="kommune-stat-label">Bosteder</span>
            <span className="kommune-stat-sub">Med STPS-rapport</span>
          </div>
          <div className={`kommune-stat-kort${detail.antalKritiske > 0 ? ' kommune-stat-kort-advarsel' : ''}`}>
            <AlertTriangle size={16} className="kommune-stat-ikon" />
            <span className="kommune-stat-tal">{detail.antalKritiske}</span>
            <span className="kommune-stat-label">Kritiske fund</span>
            <span className="kommune-stat-sub">Seneste rapport</span>
          </div>
          <div className="kommune-stat-kort">
            <Users size={16} className="kommune-stat-ikon" />
            <span className="kommune-stat-tal">{detail.inspektoerer.length}</span>
            <span className="kommune-stat-label">Inspektører</span>
            <span className="kommune-stat-sub">Har ført tilsyn</span>
          </div>
          <div className="kommune-stat-kort kommune-stat-kort-total">
            <span className="kommune-stat-tal">{detail.totalBorgere.toLocaleString('da-DK')}</span>
            <span className="kommune-stat-label">Borgere i botilbud</span>
            <span className="kommune-stat-sub">§107 + §108, DST</span>
          </div>
          {detail.senesteDato && (
            <div className="kommune-stat-kort">
              <Calendar size={16} className="kommune-stat-ikon" />
              <span className="kommune-stat-tal kommune-stat-tal-sm">
                {new Date(detail.senesteDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="kommune-stat-label">Seneste tilsyn</span>
              <span className="kommune-stat-sub">I kommunen</span>
            </div>
          )}
        </div>
      </div>

      <div className="kommune-detail-grid">
        {/* Fund fordeling */}
        {detail.fundFordeling.length > 0 && (
          <div className="kommune-sektion-kort">
            <h2 className="kommune-sektion-titel">Fund-fordeling</h2>
            <div className="kommune-fund-liste">
              {detail.fundFordeling.map((f) => (
                <div key={f.niveau} className="kommune-fund-række">
                  <span className="kommune-fund-label">{FUND_LABELS[f.niveau] ?? f.niveau}</span>
                  <div className="kommune-fund-bar-wrap">
                    <div
                      className="kommune-fund-bar"
                      style={{ width: `${(f.antal / maxFund) * 100}%`, background: FUND_BAR_COLOR[f.niveau] ?? '#94a3b8' }}
                    />
                  </div>
                  <span className="kommune-fund-antal">{f.antal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspektører */}
        {detail.inspektoerer.length > 0 && (
          <div className="kommune-sektion-kort">
            <h2 className="kommune-sektion-titel">Inspektører der har ført tilsyn</h2>
            <div className="kommune-insp-liste">
              {detail.inspektoerer.map((ins) => (
                <Link key={ins.slug} href={`/dashboard/rapporter/inspektoerer/${ins.slug}`} className="kommune-insp-række">
                  <InspektoerAvatar slug={ins.slug} navn={ins.navn} size={36} />
                  <div className="kommune-insp-tekst">
                    <span className="kommune-insp-navn">{ins.navn}</span>
                    {ins.titel && <span className="kommune-insp-titel">{ins.titel}</span>}
                  </div>
                  <span className="kommune-insp-antal">{ins.antalIKommune} tilsyn</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bosteder tabel */}
      <div className="kommune-sektion-overskrift">
        <h2 className="kommune-sektion-titel">Bosteder i {kortNavn} Kommune</h2>
        <span className="kommune-sektion-antal">{totalBosteder} bosteder</span>
      </div>

      {totalBosteder === 0 ? (
        <div className="kommuner-ingen-bosteder">Ingen bosteder fundet i databasen for {detail.navn}.</div>
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
                      {FUND_LABELS[b.fundNiveau] ?? b.fundNiveau}
                    </span>
                  </td>
                  <td className="table-cell-muted">
                    {b.rapportDato
                      ? new Date(b.rapportDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
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
                      <a href={b.rapportLink} target="_blank" rel="noopener noreferrer" className="kommuner-rapport-link" title="Åbn rapport">
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
