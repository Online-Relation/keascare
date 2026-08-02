'use client';

// src/features/stps/components/InspektoerProfil/sections/ProfilKommunerListe/ProfilKommunerListe.tsx

import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoer: InspektoerFuldStat };

type KommuneStat = { navn: string; tilsyn: number; bosteder: number; seneste: string | null };

export function ProfilKommunerListe({ inspektoer: ins }: Props) {
  const map = new Map<string, KommuneStat>();

  for (const r of ins.rapporter) {
    const k = r.kommune ?? r.region ?? 'Ukendt';
    const eks = map.get(k);
    const seneste = eks?.seneste && (!r.dato || eks.seneste > r.dato) ? eks.seneste : r.dato;
    if (!eks) {
      map.set(k, { navn: k, tilsyn: 1, bosteder: 1, seneste: r.dato });
    } else {
      eks.tilsyn++;
      eks.seneste = seneste;
    }
  }

  const kommuner = [...map.values()].sort((a, b) => b.tilsyn - a.tilsyn);

  if (kommuner.length === 0) return null;

  return (
    <div className="profil-sektion">
      <h2 className="profil-sektion-titel">Geografisk aktivitet</h2>
      <div className="profil-kommune-liste">
        <div className="profil-kommune-header">
          <span>Kommune / Region</span>
          <span>Tilsyn</span>
          <span>Seneste</span>
        </div>
        {kommuner.map((k) => (
          <div key={k.navn} className="profil-kommune-raekke">
            <span className="profil-kommune-navn">{k.navn}</span>
            <span className="profil-kommune-antal">{k.tilsyn}</span>
            <span className="profil-kommune-dato">
              {k.seneste ? new Date(k.seneste).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
