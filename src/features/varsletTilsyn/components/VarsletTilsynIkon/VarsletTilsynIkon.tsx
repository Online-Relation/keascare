'use client';

// src/features/varsletTilsyn/components/VarsletTilsynIkon/VarsletTilsynIkon.tsx

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export function VarsletTilsynIkon() {
  const [antal, setAntal] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/varslet-tilsyn')
      .then((r) => r.json())
      .then((data: unknown[]) => setAntal(Array.isArray(data) ? data.length : 0))
      .catch(() => setAntal(0));
  }, []);

  return (
    <Link href="/dashboard/varslet-tilsyn" className="varslet-ikon-link" aria-label="Varslede tilsyn">
      <Bell size={15} />
      {antal !== null && antal > 0 && (
        <span className="varslet-ikon-badge">{antal}</span>
      )}
    </Link>
  );
}
