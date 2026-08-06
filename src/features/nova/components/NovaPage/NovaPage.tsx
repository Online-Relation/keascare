// src/features/nova/components/NovaPage/NovaPage.tsx

import Image from 'next/image';
import type { NatsrapportRad, KvalitetSnapshotRad } from '@/app/dashboard/nova/page';
import { NovaKvalitetsoversigt } from './sections/NovaKvalitetsoversigt';
import { NovaKvalitetKurve } from './sections/NovaKvalitetKurve';
import { NovaArbejdslog } from './sections/NovaArbejdslog';

type Datakvalitet = {
  total:      number;
  medCvr:     number;
  medTp:      number;
  medKontakt: number;
  medPdf:     number;
  medMonday:  number;
  medLos:     number;
};

type Props = {
  natsrapporter:    NatsrapportRad[];
  datakvalitet:     Datakvalitet;
  kvalitetSnapshots: KvalitetSnapshotRad[];
};

export function NovaPage({ natsrapporter, datakvalitet, kvalitetSnapshots }: Props) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          overflow: 'hidden', border: '2px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <Image
            src="/images/medarbejdere/nova.webp"
            alt="Nova"
            width={64}
            height={64}
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0 }}>Nova</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0' }}>
            Digital Lead Analyst · Arbejder automatisk hver nat for at holde jeres data opdateret
          </p>
        </div>
      </div>

      {/* Kvalitetsscore over tid */}
      <NovaKvalitetKurve snapshots={kvalitetSnapshots} />

      {/* Datakvalitetsoversigt — nuværende breakdown */}
      <NovaKvalitetsoversigt datakvalitet={datakvalitet} />

      {/* Arbejdslog */}
      <NovaArbejdslog natsrapporter={natsrapporter} />

    </div>
  );
}
