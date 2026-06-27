// src/features/dashboard/components/DashboardPage/sections/SalgsFunnel/SalgsFunnel.tsx

import type { SalgsFunnel as SalgsFunnelType } from '@/features/dashboard/types/dashboard.types';

type Props = {
  funnel: SalgsFunnelType;
};

const TRIN_FARVER = [
  { bg: '#f0f9ff', border: '#bae6fd', tekst: '#0369a1', bar: '#0ea5e9' },
  { bg: '#fef9c3', border: '#fde68a', tekst: '#92400e', bar: '#f59e0b' },
  { bg: '#ffedd5', border: '#fed7aa', tekst: '#c2410c', bar: '#f97316' },
  { bg: '#fee2e2', border: '#fecaca', tekst: '#b91c1c', bar: '#ef4444' },
  { bg: '#dcfce7', border: '#bbf7d0', tekst: '#15803d', bar: '#22c55e' },
];

export function SalgsFunnel({ funnel }: Props) {
  const max = funnel.trin[0]?.antal ?? 1;

  return (
    <div className="sf-wrapper">
      <div className="sf-header">
        <h2 className="sf-titel">Salgstragt</h2>
        <p className="sf-beskrivelse">Baseret på det valgte tidsinterval og driftsform-filter</p>
      </div>

      <div className="sf-trin-liste">
        {funnel.trin.map((trin, i) => {
          const pct = max > 0 ? Math.round((trin.antal / max) * 100) : 0;
          const farve = TRIN_FARVER[i] ?? TRIN_FARVER[0];
          return (
            <div key={trin.label} className="sf-trin" style={{ borderColor: farve.border, backgroundColor: farve.bg }}>
              <div className="sf-trin-top">
                <div className="sf-trin-info">
                  <span className="sf-trin-nummer" style={{ color: farve.tekst }}>{i + 1}</span>
                  <div>
                    <div className="sf-trin-label">{trin.label}</div>
                    <div className="sf-trin-beskrivelse">{trin.beskrivelse}</div>
                  </div>
                </div>
                <div className="sf-trin-antal" style={{ color: farve.tekst }}>{trin.antal.toLocaleString('da-DK')}</div>
              </div>
              <div className="sf-bar-track">
                <div
                  className="sf-bar-fill"
                  style={{ width: `${pct}%`, backgroundColor: farve.bar }}
                />
              </div>
              {i < funnel.trin.length - 1 && (
                <div className="sf-konvertering">
                  {funnel.trin[i + 1] && max > 0
                    ? `↓ ${Math.round((funnel.trin[i + 1].antal / trin.antal) * 100)}% videre til næste trin`
                    : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
