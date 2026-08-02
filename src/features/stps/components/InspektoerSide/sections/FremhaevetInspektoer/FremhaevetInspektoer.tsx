'use client';

// src/features/stps/components/InspektoerSide/sections/FremhaevetInspektoer/FremhaevetInspektoer.tsx

import { useRouter } from 'next/navigation';
import { Star, ChevronRight } from 'lucide-react';
import { InspektoerAvatar } from '../../InspektoerAvatar';
import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoer: InspektoerFuldStat };

function formatDato(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function FremhaevetInspektoer({ inspektoer: ins }: Props) {
  const router = useRouter();
  const fundPct    = ins.antal > 0 ? Math.round((ins.antalMedFund / ins.antal) * 100) : 0;
  const kritiskPct = ins.antal > 0 ? Math.round((ins.antalKritiske / ins.antal) * 100) : 0;

  return (
    <div className="insp-fremhaevet">
      <div className="insp-fremhaevet-venstre">
        <div className="insp-fremhaevet-avatar-wrap">
          <InspektoerAvatar navn={ins.navn} slug={ins.slug} size={80} />
          <span className="insp-fremhaevet-stjerne"><Star size={14} fill="currentColor" /></span>
        </div>
        <div className="insp-fremhaevet-info">
          <h2 className="insp-fremhaevet-navn">{ins.navn}</h2>
          <p className="insp-fremhaevet-titel">{ins.titel ?? 'Stilling ikke angivet'}</p>
          <p className="insp-fremhaevet-antal"><strong>{ins.antal}</strong> tilsyn</p>
          <p className="insp-fremhaevet-meta">
            {ins.bosteder.length} bosteder · {ins.kommuner.length} kommuner · Seneste tilsyn {formatDato(ins.senesteDato)}
          </p>
        </div>
      </div>

      <div className="insp-fremhaevet-midt">
        <div className="insp-fremhaevet-stat">
          <span className="insp-fremhaevet-stat-label">Fund i</span>
          <span className="insp-fremhaevet-stat-tal">{fundPct} %</span>
          <span className="insp-fremhaevet-stat-label">af rapporterne</span>
        </div>
        <div className="insp-fremhaevet-stat">
          <span className="insp-fremhaevet-stat-label">Kritiske fund i</span>
          <span className="insp-fremhaevet-stat-tal insp-kritisk">{kritiskPct} %</span>
        </div>
      </div>

      <div className="insp-fremhaevet-hojre">
        <p className="insp-fremhaevet-fund-titel">Mest almindelige fund:</p>
        <ul className="insp-fremhaevet-fund-liste">
          {ins.mesteFund.slice(0, 3).map((f) => (
            <li key={f.tema}>{f.tema}</li>
          ))}
          {ins.mesteFund.length === 0 && <li className="insp-ingen">Ingen temaer registreret</li>}
        </ul>
        <button
          className="insp-profil-knap"
          onClick={() => router.push(`/dashboard/rapporter/inspektoerer/${ins.slug}`)}
        >
          Se profil <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
