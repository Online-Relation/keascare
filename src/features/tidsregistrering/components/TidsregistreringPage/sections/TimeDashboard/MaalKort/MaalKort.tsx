'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/MaalKort/MaalKort.tsx

import { CheckCircle, XCircle } from 'lucide-react';
import { beregnFordeling } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { Tidsregistrering, TidsregistreringKategori } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = {
  registreringer: Tidsregistrering[];
  kategorier: TidsregistreringKategori[];
};

type MålStatus = 'ok' | 'over' | 'under';

export function MaalKort({ registreringer, kategorier }: Props) {
  const harMål = kategorier.some((k) => k.maalMaxPct != null || k.maalMinPct != null);

  if (!harMål) {
    return (
      <div className="tr-dash-sektion">
        <h2 className="tr-dash-sektion-titel">Mål & nøgletal</h2>
        <p className="tr-dash-tom">
          Sæt mål pr. kategori under Kategorier → Indstillinger for at aktivere denne visning.
        </p>
      </div>
    );
  }

  const fordeling = beregnFordeling(registreringer);
  const fordelingMap = new Map(fordeling.map((f) => [f.kategoriId, f.procentAndel]));

  const rækker = kategorier
    .filter((k) => k.maalMaxPct != null || k.maalMinPct != null)
    .map((k) => {
      const faktiskPct = fordelingMap.get(k.id) ?? 0;
      let status: MålStatus = 'ok';
      let maalTekst = '';

      if (k.maalMaxPct != null && faktiskPct > k.maalMaxPct) {
        status = 'over';
        maalTekst = `Maks. ${k.maalMaxPct}%`;
      } else if (k.maalMinPct != null && faktiskPct < k.maalMinPct) {
        status = 'under';
        maalTekst = `Min. ${k.maalMinPct}%`;
      } else {
        maalTekst = [
          k.maalMinPct != null ? `Min. ${k.maalMinPct}%` : '',
          k.maalMaxPct != null ? `Maks. ${k.maalMaxPct}%` : '',
        ].filter(Boolean).join(' · ');
      }

      return { k, faktiskPct, status, maalTekst };
    });

  return (
    <div className="tr-dash-sektion">
      <h2 className="tr-dash-sektion-titel">Mål & nøgletal</h2>
      <div className="tr-maal-liste">
        {rækker.map(({ k, faktiskPct, status, maalTekst }) => (
          <div key={k.id} className={`tr-maal-rad tr-maal-${status}`}>
            <div className="tr-maal-ikon">
              {status === 'ok'
                ? <CheckCircle size={15} className="ok" />
                : <XCircle size={15} className="fejl" />}
            </div>
            <div className="tr-maal-info">
              <span className="tr-maal-navn">{k.navn}</span>
              <span className="tr-maal-sub">{maalTekst}</span>
            </div>
            <div className="tr-maal-pct">
              <span className="tr-maal-faktisk">{faktiskPct}%</span>
              <span className="tr-maal-status-tekst">
                {status === 'ok' ? 'Inden for mål' : status === 'over' ? 'Over mål' : 'Under mål'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
