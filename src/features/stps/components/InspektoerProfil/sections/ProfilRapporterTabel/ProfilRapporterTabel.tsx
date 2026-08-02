'use client';

// src/features/stps/components/InspektoerProfil/sections/ProfilRapporterTabel/ProfilRapporterTabel.tsx

import { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoer: InspektoerFuldStat };

const FUND_LABELS: Record<string, string> = {
  kritisk: 'Kritisk', stoerre: 'Større', mindre: 'Mindre', ingen: 'Ingen', ukendt: 'Ukendt',
};
const FUND_KLASSE: Record<string, string> = {
  kritisk: 'badge-kritisk', stoerre: 'badge-storre', mindre: 'badge-mindre', ingen: 'badge-ingen', ukendt: 'badge-ukendt',
};

export function ProfilRapporterTabel({ inspektoer: ins }: Props) {
  const [søg, setSøg] = useState('');
  const [side, setSide] = useState(1);
  const perSide = 10;

  const filtreret = ins.rapporter.filter((r) => {
    const q = søg.toLowerCase();
    return !q || r.bostedNavn.toLowerCase().includes(q) || (r.kommune ?? r.region ?? '').toLowerCase().includes(q);
  });

  const sider = Math.ceil(filtreret.length / perSide);
  const viste = filtreret.slice((side - 1) * perSide, side * perSide);

  return (
    <div className="profil-sektion">
      <div className="profil-tabel-hoved">
        <h2 className="profil-sektion-titel">Tilsyn og bosteder</h2>
        <div className="profil-tabel-soeg-wrap">
          <Search size={13} className="profil-tabel-soeg-ikon" />
          <input
            className="profil-tabel-soeg"
            type="search"
            placeholder="Søg bosted eller kommune…"
            value={søg}
            onChange={(e) => { setSøg(e.target.value); setSide(1); }}
          />
        </div>
      </div>

      <div className="profil-tabel-wrap">
        <table className="profil-tabel">
          <thead>
            <tr>
              <th>Bosted</th>
              <th>Kommune / Region</th>
              <th>Dato</th>
              <th>Tilsynsform</th>
              <th>Fund</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {viste.map((r) => (
              <tr key={r.id}>
                <td className="profil-tabel-bosted">{r.bostedNavn}</td>
                <td>{r.kommune ?? r.region ?? '—'}</td>
                <td>{r.dato ? new Date(r.dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                <td>{r.tilsynsform ?? '—'}</td>
                <td><span className={`badge ${FUND_KLASSE[r.fundNiveau] ?? 'badge-ukendt'}`}>{FUND_LABELS[r.fundNiveau] ?? r.fundNiveau}</span></td>
                <td>
                  <a href={r.rapportUrl} target="_blank" rel="noopener noreferrer" className="profil-tabel-link">
                    <ExternalLink size={13} />
                  </a>
                </td>
              </tr>
            ))}
            {viste.length === 0 && (
              <tr><td colSpan={6} className="profil-tabel-tom">Ingen rapporter matcher søgningen.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {sider > 1 && (
        <div className="profil-pagination">
          {Array.from({ length: sider }, (_, i) => (
            <button key={i} className={`profil-page-knap ${side === i + 1 ? 'aktiv' : ''}`} onClick={() => setSide(i + 1)}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}
