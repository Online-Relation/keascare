// src/features/dashboard/components/DashboardPage/sections/DashboardBottomPanels/DashboardBottomPanels.tsx

import Link from 'next/link';
import type { DashboardData, Datakilde } from '@/features/dashboard/types/dashboard.types';

type Props = {
  data: Pick<DashboardData, 'tilbudsportalen' | 'stpsFordeling' | 'topKommuner' | 'datakilder'>;
};

function statusBadge(status: Datakilde['status']) {
  if (status === 'aktiv') return { cls: 'badge-ingen', label: 'Aktiv' };
  if (status === 'ikke_implementeret') return { cls: 'badge-ukendt', label: 'Ikke koblet' };
  return { cls: 'badge-kritisk', label: 'Fejl' };
}

const fundFarver: Record<string, string> = {
  'Kritiske fund': 'var(--badge-kritisk-text)',
  'Større fund':   'var(--badge-større-text)',
  'Mindre fund':   'var(--badge-mindre-text)',
  'Ingen fund':    'var(--badge-ingen-text)',
};

export function DashboardBottomPanels({ data }: Props) {
  const { tilbudsportalen, stpsFordeling, topKommuner, datakilder } = data;

  return (
    <div className="dashboard-bottom-panels">

      {/* Tilbudsportalen */}
      <div className="card">
        <p className="card-title">Tilbudsportalen overblik</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-text-primary)' }}>
              {tilbudsportalen.total}
            </p>
            <p className="card-sub">bosteder i alt</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-primary)' }}>
                +{tilbudsportalen.nyeSidst}
              </p>
              <p className="card-sub">nye siden sidst</p>
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-primary)' }}>
                {tilbudsportalen.dækningsgrad}
              </p>
              <p className="card-sub">dækning</p>
            </div>
          </div>
          <p className="card-sub" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
            Opdateret {tilbudsportalen.sidstOpdateret}
          </p>
        </div>
      </div>

      {/* STPS fund fordeling */}
      <div className="card">
        <p className="card-title">STPS fund fordeling</p>
        <div>
          {stpsFordeling.map((item) => (
            <div key={item.label} className="stat-bar-row">
              <span className="stat-bar-label">{item.label}</span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${item.pct}%`,
                    backgroundColor: fundFarver[item.label] ?? 'var(--color-primary)',
                  }}
                />
              </div>
              <span className="stat-bar-value">{item.antal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top kommuner */}
      {topKommuner.length > 0 && (
        <div className="card">
          <p className="card-title">Top kommuner</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {topKommuner.map((k, i) => (
              <Link
                key={k.navn}
                href={`/dashboard/kommuner/${encodeURIComponent(k.navn)}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', borderBottom: i < topKommuner.length - 1 ? '1px solid var(--color-border-light)' : 'none', textDecoration: 'none' }}
                className="top-kommune-række"
              >
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', width: '1rem', textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--fw-medium)' }}>
                  {k.navn}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {k.antal} bosteder
                </span>
                <span
                  className={`badge ${k.højesteFund === 'kritisk' ? 'badge-kritisk' : k.højesteFund === 'mindre' ? 'badge-mindre' : 'badge-ingen'}`}
                  style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}
                >
                  {k.medFund} fund
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Datakilder status */}
      <div className="card">
        <p className="card-title">Datakilder</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {datakilder.map((kilde) => {
            const { cls, label } = statusBadge(kilde.status);
            return (
              <div key={kilde.navn}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: kilde.status === 'ikke_implementeret' ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}>
                    {kilde.navn}
                  </span>
                  <span className={`badge ${cls}`} style={{ opacity: kilde.status === 'ikke_implementeret' ? 0.7 : 1 }}>
                    <span className="badge-dot" />
                    {label}
                  </span>
                </div>
                {kilde.note && (
                  <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: '0.1rem 0 0' }}>
                    {kilde.note}{kilde.sidstOpdateret ? ` · ${kilde.sidstOpdateret}` : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
