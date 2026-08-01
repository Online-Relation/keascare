'use client';

// src/features/sor/components/SorBadge/SorBadge.tsx

import type { SorCacheEnhed } from '@/features/sor/services/SorService';

type Props = {
  match: SorCacheEnhed | null | undefined;
  ikkeIndlæst?: boolean;
};

export function SorBadge({ match, ikkeIndlæst }: Props) {
  if (ikkeIndlæst) {
    return <span className="sor-badge sor-badge--ukendt">SOR ?</span>;
  }

  if (match) {
    return (
      <span className="sor-badge sor-badge--registreret" title={`SOR-kode: ${match.sorKode}`}>
        SOR ✓
      </span>
    );
  }

  return <span className="sor-badge sor-badge--ikke-registreret">Ikke i SOR</span>;
}
