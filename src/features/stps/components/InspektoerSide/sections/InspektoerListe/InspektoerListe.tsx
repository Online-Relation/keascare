'use client';

// src/features/stps/components/InspektoerSide/sections/InspektoerListe/InspektoerListe.tsx

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { InspektoerAvatar } from '../../InspektoerAvatar';
import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoerer: InspektoerFuldStat[]; startFra?: number };

function formatDato(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function InspektoerListe({ inspektoerer, startFra = 1 }: Props) {
  const router = useRouter();

  if (inspektoerer.length === 0) {
    return <p className="insp-tom">Ingen inspektører matcher søgningen.</p>;
  }

  return (
    <div className="insp-liste">
      {inspektoerer.map((ins, idx) => (
        <div
          key={ins.slug}
          className="insp-liste-raekke"
          onClick={() => router.push(`/dashboard/rapporter/inspektoerer/${ins.slug}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push(`/dashboard/rapporter/inspektoerer/${ins.slug}`)}
        >
          <span className="insp-liste-nr">{startFra + idx}</span>
          <InspektoerAvatar navn={ins.navn} slug={ins.slug} size={36} />
          <div className="insp-liste-person">
            <span className="insp-liste-navn">{ins.navn}</span>
            <span className="insp-liste-titel">{ins.titel ?? 'Stilling ikke angivet'}</span>
          </div>
          <div className="insp-liste-stat">
            <span className="insp-liste-tal">{ins.antal}</span>
            <span className="insp-liste-enhed">tilsyn</span>
          </div>
          <div className="insp-liste-stat">
            <span className="insp-liste-tal">{ins.bosteder.length}</span>
            <span className="insp-liste-enhed">bosteder</span>
          </div>
          <div className="insp-liste-stat">
            <span className="insp-liste-tal">{ins.kommuner.length}</span>
            <span className="insp-liste-enhed">kommuner</span>
          </div>
          <div className="insp-liste-dato">{formatDato(ins.senesteDato)}</div>
          <button
            className="insp-se-profil-knap"
            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/rapporter/inspektoerer/${ins.slug}`); }}
          >
            Se profil <ChevronRight size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
