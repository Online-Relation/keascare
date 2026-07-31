// src/features/monday/components/ProdukterPage/sections/ProduktTabel/ProduktTabel.tsx

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ProduktLinje } from '@/features/monday/services/MondayProdukterService';

type Props = {
  linjer: ProduktLinje[];
};

export function ProduktTabel({ linjer }: Props) {
  const [åbne, setÅbne] = useState<Set<string>>(new Set());

  function toggle(produkt: string) {
    setÅbne((prev) => {
      const næste = new Set(prev);
      næste.has(produkt) ? næste.delete(produkt) : næste.add(produkt);
      return næste;
    });
  }

  return (
    <div className="produkt-tabel-wrapper">
      <h2 className="produkt-tabel-titel">Alle produkter</h2>
      <table className="produkt-tabel">
        <thead>
          <tr>
            <th>Produkt</th>
            <th style={{ textAlign: 'right' }}>Bosteder</th>
            <th style={{ width: 32 }} />
          </tr>
        </thead>
        <tbody>
          {linjer.map((linje) => (
            <>
              <tr
                key={linje.produkt}
                className="produkt-tabel-rad"
                onClick={() => toggle(linje.produkt)}
                style={{ cursor: 'pointer' }}
              >
                <td>{linje.produkt}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{linje.antal}</td>
                <td>
                  {åbne.has(linje.produkt)
                    ? <ChevronDown size={16} />
                    : <ChevronRight size={16} />}
                </td>
              </tr>
              {åbne.has(linje.produkt) && (
                <tr key={`${linje.produkt}-detail`} className="produkt-tabel-detail">
                  <td colSpan={3}>
                    <ul className="produkt-bosted-liste">
                      {linje.bostedNavne.map((navn) => (
                        <li key={navn}>{navn}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
