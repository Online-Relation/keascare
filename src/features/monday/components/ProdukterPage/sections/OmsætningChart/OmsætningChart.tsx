'use client';

// Horisontalt bar chart — omsætning per produkt

import { useState } from 'react';
import type { ProduktLinje } from '@/features/monday/services/MondayProdukterService';

const FARVER: Record<string, string> = {
  'Basispakke':                   '#4f46e5',
  'Medicinkursus':                '#0ea5e9',
  'Dokumentationskursus':         '#f59e0b',
  'Minitilsyn':                   '#ef4444',
  'Instrukser':                   '#8b5cf6',
  'Brand- og førstehjælpskursus': '#22c55e',
  'brand- og førstehjælpskursus': '#22c55e',
};

function farve(p: string) { return FARVER[p] ?? '#6b7280'; }

function fmt(v: number) {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency', currency: 'DKK', maximumFractionDigits: 0,
  }).format(v);
}

type Props = { linjer: ProduktLinje[] };

export function OmsætningChart({ linjer }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const medPris = linjer.filter((l) => l.omsætning !== null && l.omsætning > 0);
  if (medPris.length === 0) return null;

  const maxOmsætning = Math.max(...medPris.map((l) => l.omsætning!));

  return (
    <div className="omsætning-chart-wrapper">
      <div className="omsætning-chart-header">
        <h2 className="omsætning-chart-titel">Omsætning pr. produkt</h2>
        <p className="omsætning-chart-subtitle">Klik for at se detaljer nedenfor</p>
      </div>

      <div className="omsætning-chart-bars">
        {medPris.map((linje) => {
          const pct = (linje.omsætning! / maxOmsætning) * 100;
          const erHover = hovered === linje.produkt;
          const f = farve(linje.produkt);

          return (
            <div
              key={linje.produkt}
              className={`omsætning-bar-række${erHover ? ' hovered' : ''}`}
              onMouseEnter={() => setHovered(linje.produkt)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="omsætning-bar-label">{linje.produkt}</div>
              <div className="omsætning-bar-track">
                <div
                  className="omsætning-bar-fill"
                  style={{ width: `${pct}%`, background: f }}
                />
                {erHover && (
                  <div className="omsætning-tooltip" style={{ borderColor: f }}>
                    <div className="omsætning-tooltip-navn" style={{ color: f }}>{linje.produkt}</div>
                    <div className="omsætning-tooltip-tal">{fmt(linje.omsætning!)}</div>
                    <div className="omsætning-tooltip-meta">
                      {linje.antal} kunder × {linje.pris ? fmt(linje.pris) : '—'}
                      {linje.prisType === 'månedlig' ? '/md.' : ''}
                    </div>
                  </div>
                )}
              </div>
              <div className="omsætning-bar-værdi" style={{ color: erHover ? f : undefined }}>
                {fmt(linje.omsætning!)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
