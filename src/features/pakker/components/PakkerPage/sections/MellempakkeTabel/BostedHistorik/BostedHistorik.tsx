'use client';

// BostedHistorik.tsx — 12-måneders søjlegraf for et enkelt bosted

import { useState } from 'react';
import type { BeboerRegistrering } from '@/features/pakker/services/PakkerService';

const FAST_PRIS = 1895;
const BEBOER_PRIS = 289;

const MDR_KORT = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

type MånedData = {
  label: string;       // "Jul 2026"
  kortLabel: string;   // "Jul"
  aar: number;
  maaned: number;
  antal: number | null;
  beløb: number | null;
  opdateret: string | null;
};

function sidste12Måneder(): { aar: number; maaned: number }[] {
  const nu = new Date();
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(nu.getFullYear(), nu.getMonth() - i, 1);
    result.push({ aar: d.getFullYear(), maaned: d.getMonth() + 1 });
  }
  return result;
}

function formaterDato(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

type Props = {
  bostedNavn: string;
  registreringer: BeboerRegistrering[];
};

export function BostedHistorik({ bostedNavn, registreringer }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: MånedData } | null>(null);

  const måneder = sidste12Måneder();
  const data: MånedData[] = måneder.map(({ aar, maaned }) => {
    const reg = registreringer.find(
      (r) => r.bostedNavn === bostedNavn && r.aar === aar && r.maaned === maaned && r.pakke === 'FMK pakke',
    );
    return {
      label: `${MDR_KORT[maaned - 1]} ${aar}`,
      kortLabel: MDR_KORT[maaned - 1],
      aar,
      maaned,
      antal: reg != null ? reg.antalBeboere : null,
      beløb: reg != null ? FAST_PRIS + BEBOER_PRIS * reg.antalBeboere : null,
      opdateret: reg?.opdateret ?? null,
    };
  });

  const maxAntal = Math.max(...data.map((d) => d.antal ?? 0), 1);

  // SVG dimensions
  const W = 720;
  const H = 140;
  const PAD_LEFT = 36;
  const PAD_RIGHT = 12;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 28;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;
  const barW = Math.floor(chartW / 12) - 6;
  const barGap = chartW / 12;

  // Y-gridlines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: PAD_TOP + chartH - pct * chartH,
    label: Math.round(pct * maxAntal),
  }));

  return (
    <div className="bosted-historik">
      <div className="bosted-historik-header">
        <span className="bosted-historik-titel">Beboerhistorik — {bostedNavn}</span>
        <span className="bosted-historik-meta">Seneste 12 måneder</span>
      </div>

      <div className="bosted-historik-svg-wrapper" onMouseLeave={() => setTooltip(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="bosted-historik-svg" aria-hidden="true">
          {/* Gridlines */}
          {gridLines.map((g) => (
            <g key={g.y}>
              <line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={g.y} y2={g.y} stroke="var(--color-border)" strokeWidth={0.5} />
              <text x={PAD_LEFT - 4} y={g.y + 4} textAnchor="end" fontSize={9} fill="var(--color-text-muted)">{g.label}</text>
            </g>
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const barH = d.antal != null ? Math.max((d.antal / maxAntal) * chartH, d.antal === 0 ? 0 : 3) : 0;
            const x = PAD_LEFT + i * barGap + (barGap - barW) / 2;
            const y = PAD_TOP + chartH - barH;
            const harData = d.antal != null;
            const erTom = d.antal === 0;

            return (
              <g key={`${d.aar}-${d.maaned}`}>
                {/* Baggrundssøjle (altid synlig som grå) */}
                <rect
                  x={x} y={PAD_TOP} width={barW} height={chartH}
                  fill="var(--color-surface-hover, #f3f4f6)"
                  rx={3}
                />
                {/* Datasøjle */}
                {harData && !erTom && (
                  <rect
                    x={x} y={y} width={barW} height={barH}
                    fill="#0073ea" rx={3}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      const svgEl = (e.target as SVGElement).closest('svg')!;
                      const rect = svgEl.getBoundingClientRect();
                      setTooltip({
                        x: rect.left + x + barW / 2,
                        y: rect.top + y,
                        data: d,
                      });
                    }}
                  />
                )}
                {/* Nul-markering */}
                {erTom && (
                  <rect x={x} y={PAD_TOP + chartH - 3} width={barW} height={3} fill="#0073ea88" rx={2} />
                )}
                {/* Ikke registreret — skravering */}
                {!harData && (
                  <rect
                    x={x} y={PAD_TOP} width={barW} height={chartH}
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    rx={3}
                  />
                )}
                {/* Måned-label */}
                <text
                  x={x + barW / 2} y={H - 6}
                  textAnchor="middle" fontSize={9}
                  fill={harData ? 'var(--color-text-primary)' : 'var(--color-text-muted)'}
                  fontWeight={harData ? 600 : 400}
                >
                  {d.kortLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="bosted-historik-tooltip"
            style={{ left: tooltip.x, top: tooltip.y - 8 }}
          >
            <div className="bosted-historik-tooltip-label">{tooltip.data.label}</div>
            <div className="bosted-historik-tooltip-antal">{tooltip.data.antal} beboere</div>
            <div className="bosted-historik-tooltip-beloeb">
              {tooltip.data.beløb?.toLocaleString('da-DK')} kr
            </div>
            <div className="bosted-historik-tooltip-dato">
              Opdateret {formaterDato(tooltip.data.opdateret)}
            </div>
          </div>
        )}
      </div>

      {/* Måneds-oversigt som chips */}
      <div className="bosted-historik-chips">
        {data.map((d) => (
          <div
            key={`${d.aar}-${d.maaned}`}
            className={`bosted-historik-chip${d.antal != null ? ' har-data' : ' mangler'}`}
            title={d.antal != null ? `${d.antal} beboere · ${d.beløb?.toLocaleString('da-DK')} kr` : 'Ikke registreret'}
          >
            <span className="chip-mdr">{d.kortLabel}</span>
            <span className="chip-antal">{d.antal != null ? d.antal : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
