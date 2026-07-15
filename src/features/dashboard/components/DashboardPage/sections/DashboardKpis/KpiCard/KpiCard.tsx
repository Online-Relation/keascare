// src/features/dashboard/components/DashboardPage/sections/DashboardKpis/KpiCard/KpiCard.tsx

import type { KpiItem, KpiIkon } from '@/features/dashboard/types/dashboard.types';

type KpiCardProps = {
  kpi: KpiItem;
};

const IKON_CONFIG: Record<KpiIkon, { bg: string; farve: string; svg: React.ReactElement }> = {
  marked: {
    bg: '#f3e8ff',
    farve: '#7c3aed',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
      </svg>
    ),
  },
  kortlagt: {
    bg: '#e6f4f1',
    farve: '#2fb5a0',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  varm: {
    bg: '#fee2e2',
    farve: '#dc2626',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  kontakt: {
    bg: '#dbeafe',
    farve: '#1d4ed8',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
      </svg>
    ),
  },
};

function Sparkline({ farve, positiv, points: rawPoints }: { farve: string; positiv?: boolean; points?: number[] }) {
  // Brug reelle datapunkter hvis tilgængelige, ellers fallback til statisk kurve
  if (rawPoints && rawPoints.length >= 2 && rawPoints.some((v) => v > 0)) {
    const W = 90;
    const H = 32;
    const PAD = 3;
    const min = Math.min(...rawPoints);
    const max = Math.max(...rawPoints);
    const range = max - min || 1;
    const xs = rawPoints.map((_, i) => PAD + (i / (rawPoints!.length - 1)) * (W - PAD * 2));
    const ys = rawPoints.map((v) => H - PAD - ((v - min) / range) * (H - PAD * 2));

    // Smooth linje via cubic bezier
    let d = `M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
    for (let i = 1; i < xs.length; i++) {
      const cpX = (xs[i - 1] + xs[i]) / 2;
      d += ` C${cpX.toFixed(1)},${ys[i - 1].toFixed(1)} ${cpX.toFixed(1)},${ys[i].toFixed(1)} ${xs[i].toFixed(1)},${ys[i].toFixed(1)}`;
    }
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true">
        <path d={d} stroke={farve} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    );
  }

  const path = positiv !== false
    ? 'M0,28 C10,26 20,22 30,20 C40,18 50,14 60,10 C70,7 80,5 90,3'
    : 'M0,8 C10,9 20,12 30,15 C40,18 50,20 60,22 C70,24 80,26 90,27';
  return (
    <svg width="90" height="32" viewBox="0 0 90 32" fill="none" aria-hidden="true">
      <path d={path} stroke={farve} strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

export function KpiCard({ kpi }: KpiCardProps) {
  const config = kpi.ikon ? IKON_CONFIG[kpi.ikon] : null;

  return (
    <div className="kpi-card">
      <div className="kpi-card__top">
        {config && (
          <div className="kpi-card__ikon-cirkel" style={{ backgroundColor: config.bg, color: config.farve }}>
            {config.svg}
          </div>
        )}
        <div className="kpi-card__tekst">
          <p className="kpi-label">{kpi.label}</p>
          <p className="kpi-value">{kpi.value}</p>
        </div>
        {config && (
          <div className="kpi-card__sparkline">
            <Sparkline farve={config.farve} positiv={kpi.trendPositive} points={kpi.sparkPoints} />
          </div>
        )}
      </div>
      <p className="kpi-sub">{kpi.sub}</p>
      {kpi.trend && (
        <p className={kpi.trendPositive ? 'kpi-trend-up' : 'kpi-trend-down'}>
          {kpi.trendPositive ? '↑' : '↓'} {kpi.trend}
        </p>
      )}
    </div>
  );
}
