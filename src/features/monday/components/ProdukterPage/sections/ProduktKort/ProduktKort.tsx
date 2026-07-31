// src/features/monday/components/ProdukterPage/sections/ProduktKort/ProduktKort.tsx

import type { ProduktLinje } from '@/features/monday/services/MondayProdukterService';

const PRODUKT_FARVER: Record<string, string> = {
  'Stor pakke':      '#4f46e5',
  'FMK pakke':       '#0ea5e9',
  'Medicinkursus':   '#22c55e',
  'Dokumentations…': '#f59e0b',
  'Minitilsyn':      '#ef4444',
  'Instrukser':      '#8b5cf6',
};

function farve(produkt: string): string {
  return PRODUKT_FARVER[produkt] ?? '#6b7280';
}

type Props = {
  linje: ProduktLinje;
  max: number;
};

export function ProduktKort({ linje, max }: Props) {
  const pct = max > 0 ? Math.round((linje.antal / max) * 100) : 0;

  return (
    <div className="produkt-kort">
      <div className="produkt-kort-header">
        <div className="produkt-dot" style={{ background: farve(linje.produkt) }} />
        <span className="produkt-navn">{linje.produkt}</span>
        <span className="produkt-antal">{linje.antal}</span>
      </div>
      <div className="produkt-bar-track">
        <div
          className="produkt-bar-fill"
          style={{ width: `${pct}%`, background: farve(linje.produkt) }}
        />
      </div>
      <div className="produkt-label-sub">
        {linje.antal} {linje.antal === 1 ? 'bosted' : 'bosteder'}
      </div>
    </div>
  );
}
