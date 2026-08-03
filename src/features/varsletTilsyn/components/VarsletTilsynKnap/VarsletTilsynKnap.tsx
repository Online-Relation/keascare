'use client';

// src/features/varsletTilsyn/components/VarsletTilsynKnap/VarsletTilsynKnap.tsx

import { useState } from 'react';
import { Bell, BellOff, Loader } from 'lucide-react';

type Props = {
  bostedId: string;
  bostedNavn: string;
  kommune: string | null;
  senesteRapportDato: string | null;
  varslingId: string | null;
};

export function VarsletTilsynKnap({ bostedId, bostedNavn, kommune, senesteRapportDato, varslingId: initialVarslingId }: Props) {
  const [varslingId, setVarslingId] = useState<string | null>(initialVarslingId);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      if (varslingId) {
        await fetch(`/api/varslet-tilsyn/${varslingId}`, { method: 'DELETE' });
        setVarslingId(null);
      } else {
        const res = await fetch('/api/varslet-tilsyn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bostedId, bostedNavn, kommune, senesteRapportDato }),
        });
        const data = await res.json() as { id: string };
        setVarslingId(data.id);
      }
    } finally {
      setLoading(false);
    }
  }

  const aktiv = !!varslingId;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`btn btn-sm ${aktiv ? 'btn-varslet' : 'btn-outline'}`}
      title={aktiv ? 'Fjern varslet tilsyn' : 'Markér som varslet tilsyn'}
    >
      {loading
        ? <Loader size={14} className="varslet-knap-spinner" />
        : aktiv
          ? <BellOff size={14} />
          : <Bell size={14} />}
      {aktiv ? 'Varslet tilsyn' : 'Varslet tilsyn?'}
    </button>
  );
}
