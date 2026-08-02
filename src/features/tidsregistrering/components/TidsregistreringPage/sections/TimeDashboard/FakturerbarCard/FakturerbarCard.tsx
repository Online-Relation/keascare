'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/FakturerbarCard/FakturerbarCard.tsx

import { DollarSign } from 'lucide-react';
import { formatMinKort } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { Tidsregistrering, TidsregistreringKategori } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = {
  registreringer: Tidsregistrering[];
  kategorier: TidsregistreringKategori[];
};

export function FakturerbarCard({ registreringer, kategorier }: Props) {
  const katMap = new Map(kategorier.map((k) => [k.id, k]));
  const harFakturerbar = kategorier.some((k) => k.erFakturerbar);

  if (!harFakturerbar) {
    return (
      <div className="tr-dash-sektion">
        <h2 className="tr-dash-sektion-titel">Fakturerbare timer</h2>
        <p className="tr-dash-tom">
          Markér kategorier som "Fakturerbar" under Kategorier → Indstillinger for at aktivere denne visning.
        </p>
      </div>
    );
  }

  let fakturerbareMin = 0;
  let estimatKr       = 0;
  let harTimepris      = false;

  for (const r of registreringer) {
    const kat = katMap.get(r.kategoriId);
    if (!kat?.erFakturerbar) continue;
    const min = r.varighedMinutter ?? 0;
    fakturerbareMin += min;
    if (kat.timepris) {
      estimatKr += (min / 60) * kat.timepris;
      harTimepris = true;
    }
  }

  const total = registreringer.reduce((s, r) => s + (r.varighedMinutter ?? 0), 0);
  const andel = total > 0 ? Math.round((fakturerbareMin / total) * 100) : 0;

  return (
    <div className="tr-dash-sektion">
      <h2 className="tr-dash-sektion-titel">Fakturerbare timer</h2>
      {fakturerbareMin === 0 ? (
        <p className="tr-dash-tom">Ingen fakturerbare timer i perioden.</p>
      ) : (
        <div className="tr-fak-indhold">
          <div className="tr-fak-hoved">
            <span className="tr-fak-tid">{formatMinKort(fakturerbareMin)}</span>
            {harTimepris && (
              <span className="tr-fak-kr">
                <DollarSign size={14} />
                {Math.round(estimatKr).toLocaleString('da-DK')} kr.
              </span>
            )}
          </div>
          <div className="tr-fak-andel">
            <div className="tr-dash-progress-bar" style={{ marginTop: 0 }}>
              <div className="tr-dash-progress-fill" style={{ width: `${andel}%`, background: '#059669' }} />
            </div>
            <span>{andel}% af samlet tid</span>
          </div>
        </div>
      )}
    </div>
  );
}
