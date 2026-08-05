// src/features/dashboard/components/DataKvalitetBadge/DataKvalitetBadge.tsx

import type { DataKvalitet } from '@/features/dashboard/types/dashboard.types';

type Props = {
  dataKvalitet: DataKvalitet;
  vis?: 'kompakt' | 'fuld';
};

const KILDER = ['STPS', 'CVR', 'TP', 'Kontakt', 'Adresse', 'Website', 'Pladser'];

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
        <span style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginRight: '0.35rem' }}>
          Datamatch
        </span>
        <div className={`dkb-score ${klasse}`}>
          {score}/{max}
        </div>
        <div className="dkb-kilde-liste">
          {KILDER.map((kilde, i) => {
            const aktiv = dataKvalitet.aktive ? dataKvalitet.aktive[i] : i < score;
            return (
              <span key={kilde} className={`dkb-kilde ${aktiv ? 'dkb-kilde-aktiv' : 'dkb-kilde-mangler'}`}>
                {kilde}
              </span>
            );
          })}
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
