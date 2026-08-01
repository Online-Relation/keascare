'use client';

// src/features/pakker/components/PakkerPage/sections/BasispakkeTabel/BasispakkeTabel.tsx

import type { BostedOptagelse } from '@/features/monday/services/MondayProdukterService';

const BASISPAKKE_PRIS = 1895;

type Props = {
  bosteder: BostedOptagelse[];
};

function beregnMånederAktiv(startdato: string | null): number | null {
  if (!startdato) return null;
  const start = new Date(startdato);
  const nu = new Date();
  if (isNaN(start.getTime())) return null;
  return (
    (nu.getFullYear() - start.getFullYear()) * 12 +
    (nu.getMonth() - start.getMonth()) + 1
  );
}

export function BasispakkeTabel({ bosteder }: Props) {
  const totalMrr = bosteder.length * BASISPAKKE_PRIS;

  return (
    <div className="pakker-sektion">
      <div className="pakker-sektion-header">
        <span className="pakker-pakke-badge" style={{ background: '#00ca72' }}>Basispakke</span>
        <span className="pakker-sektion-meta">{bosteder.length} kunder · {totalMrr.toLocaleString('da-DK')} kr/md</span>
      </div>

      <div className="pakker-tabel-wrapper">
        <table className="pakker-tabel">
          <thead>
            <tr>
              <th>Bosted</th>
              <th>Startdato</th>
              <th>Måneder aktiv</th>
              <th className="pakker-th-tal">Pris/md</th>
            </tr>
          </thead>
          <tbody>
            {bosteder.map((b) => {
              const måneder = beregnMånederAktiv(b.dato);
              return (
                <tr key={b.navn}>
                  <td>{b.navn}</td>
                  <td>{b.dato ?? '—'}</td>
                  <td>{måneder != null ? `${måneder} mdr.` : '—'}</td>
                  <td className="pakker-td-tal">{BASISPAKKE_PRIS.toLocaleString('da-DK')} kr</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="pakker-tabel-total">
              <td colSpan={3}>Total MRR</td>
              <td className="pakker-td-tal">{totalMrr.toLocaleString('da-DK')} kr</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
