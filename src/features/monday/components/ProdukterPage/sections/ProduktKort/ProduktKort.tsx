'use client';

// src/features/monday/components/ProdukterPage/sections/ProduktKort/ProduktKort.tsx

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ProduktLinje } from '@/features/monday/services/MondayProdukterService';

const PRODUKT_KONFIG: Record<string, { farve: string; ikon: string }> = {
  'Basispakke':                       { farve: '#4f46e5', ikon: '📦' },
  'Medicinkursus':                    { farve: '#0ea5e9', ikon: '💊' },
  'Dokumentationskursus':             { farve: '#f59e0b', ikon: '📄' },
  'Minitilsyn':                       { farve: '#ef4444', ikon: '🔍' },
  'Instrukser':                       { farve: '#8b5cf6', ikon: '📋' },
  'Brand- og førstehjælpskursus':     { farve: '#22c55e', ikon: '🚒' },
  'brand- og førstehjælpskursus':     { farve: '#22c55e', ikon: '🚒' },
};

function konfig(produkt: string) {
  return PRODUKT_KONFIG[produkt] ?? { farve: '#6b7280', ikon: '🏠' };
}

function formaterKr(tal: number): string {
  return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(tal);
}

function formaterDato(dato: string | null): string {
  if (!dato) return '';
  try {
    return new Date(dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dato;
  }
}

type Props = { linje: ProduktLinje; max: number };

export function ProduktKort({ linje, max }: Props) {
  const [åben, setÅben] = useState(false);
  const { farve, ikon } = konfig(linje.produkt);
  const pct = max > 0 ? Math.round((linje.antal / max) * 100) : 0;

  return (
    <div className={`produkt-kort-v2${åben ? ' åben' : ''}`} onClick={() => setÅben((v) => !v)}>
      <div className="produkt-kort-top">
        <div className="produkt-kort-nav">
          <div className="produkt-ikon" style={{ background: `${farve}18` }}>
            {ikon}
          </div>
          <p className="produkt-kort-navn">{linje.produkt}</p>
          <ChevronDown size={16} className="produkt-pil" />
        </div>

        <div className="produkt-kort-tal-række">
          <div>
            <div className="produkt-stort-tal" style={{ color: farve }}>{linje.antal}</div>
            <div className="produkt-stort-tal-label">kunder</div>
          </div>
          <div className="produkt-kort-meta">
            {linje.omsætning !== null ? (
              <>
                <div className="produkt-omsætning">{formaterKr(linje.omsætning)}</div>
                <div className="produkt-pris-label">
                  {linje.pris ? `${formaterKr(linje.pris)} pr. ${linje.prisType === 'månedlig' ? 'md.' : 'stk.'}` : ''}
                </div>
                {linje.prisType === 'månedlig' && <span className="produkt-badge-mrr">MRR</span>}
                {linje.prisType === 'engangspris' && <span className="produkt-badge-engangspris">Engangspris</span>}
              </>
            ) : (
              <span className="produkt-pris-label" style={{ fontStyle: 'italic' }}>Pris ikke sat</span>
            )}
          </div>
        </div>
      </div>

      <div className="produkt-bar-track">
        <div className="produkt-bar-fill" style={{ width: `${pct}%`, background: farve }} />
      </div>

      {åben && (
        <div className="produkt-bosteder" onClick={(e) => e.stopPropagation()}>
          <div className="produkt-bosteder-header">
            <span>Bosted</span>
            <span>Dato</span>
          </div>
          {linje.bosteder.map((b) => (
            <div key={b.navn} className="produkt-bosted-række">
              <span className="produkt-bosted-navn">{b.navn}</span>
              <span className="produkt-bosted-dato">{formaterDato(b.dato)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
