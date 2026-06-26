// src/features/dashboard/components/DataKvalitetBadge/DataKvalitetBadge.tsx

import type { DataKvalitet } from '@/features/dashboard/types/dashboard.types';

type Props = {
  dataKvalitet: DataKvalitet;
  vis?: 'kompakt' | 'fuld';
};

const KILDER = ['PDF', 'CVR', 'P-nr', 'TP', 'Kontakt', 'Adresse', 'Website'];

function farveKlasse(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.83) return 'dkb-groen';
  if (pct >= 0.5)  return 'dkb-gul';
  return 'dkb-roed';
}

export function DataKvalitetBadge({ dataKvalitet, vis = 'kompakt' }: Props) {
  const { score, max } = dataKvalitet;
  const klasse = farveKlasse(score, max);

  if (vis === 'fuld') {
    return (
      <div className="dkb-fuld">
        <div className={`dkb-score ${klasse}`}>
          {score}/{max}
        </div>
        <div className="dkb-kilde-liste">
          {KILDER.map((kilde, i) => (
            <span key={kilde} className={`dkb-kilde ${i < score ? 'dkb-kilde-aktiv' : 'dkb-kilde-mangler'}`}>
              {kilde}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <span className={`dkb-badge ${klasse}`} title={`Datakvalitet: ${score} af ${max} kilder`}>
      {score}/{max}
    </span>
  );
}
