'use client';

// src/features/stps/components/InspektoerProfil/sections/ProfilFundListe/ProfilFundListe.tsx

import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoer: InspektoerFuldStat };

export function ProfilFundListe({ inspektoer: ins }: Props) {
  if (ins.mesteFund.length === 0) return null;
  const max = ins.mesteFund[0]?.antal ?? 1;

  return (
    <div className="profil-sektion">
      <h2 className="profil-sektion-titel">Mest almindelige fund</h2>
      <div className="profil-fund-liste">
        {ins.mesteFund.map((f, idx) => {
          const pct = ins.antal > 0 ? Math.round((f.antal / ins.antal) * 100) : 0;
          return (
            <div key={f.tema} className="profil-fund-raekke">
              <span className="profil-fund-nr">{idx + 1}</span>
              <div className="profil-fund-info">
                <div className="profil-fund-navn-wrap">
                  <span className="profil-fund-navn">{f.tema}</span>
                  <span className="profil-fund-tal">{f.antal} rapporter · {pct} %</span>
                </div>
                <div className="profil-fund-bar">
                  <div className="profil-fund-bar-fill" style={{ width: `${Math.round((f.antal / max) * 100)}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
