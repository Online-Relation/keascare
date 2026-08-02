'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/sections/TimeDashboard/SenesteRegistreringer/SenesteRegistreringer.tsx

import { Trash2 } from 'lucide-react';
import { formatMinKort } from '@/features/tidsregistrering/utils/DashboardUtils';
import type { Tidsregistrering } from '@/features/tidsregistrering/types/tidsregistrering.types';

type Props = {
  registreringer: Tidsregistrering[];
  onSlet: (id: string) => void;
  onSeAlle: () => void;
};

function formatKlokkeslet(iso: string): string {
  return new Date(iso).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
}

function formatDato(iso: string): string {
  const d = new Date(iso);
  const nu = new Date();
  const igår = new Date(nu); igår.setDate(nu.getDate() - 1);
  if (d.toDateString() === nu.toDateString()) return 'I dag';
  if (d.toDateString() === igår.toDateString()) return 'I går';
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
}

export function SenesteRegistreringer({ registreringer, onSlet, onSeAlle }: Props) {
  const seneste = [...registreringer].reverse().slice(0, 5);

  return (
    <div className="tr-dash-sektion">
      <div className="tr-dash-sektion-hoved">
        <h2 className="tr-dash-sektion-titel">Seneste registreringer</h2>
        {registreringer.length > 5 && (
          <button className="tr-dash-se-alle-link" onClick={onSeAlle}>Se alle</button>
        )}
      </div>
      {seneste.length === 0 ? (
        <p className="tr-dash-tom">Ingen registreringer i perioden.</p>
      ) : (
        <div className="tr-dash-seneste-liste">
          {seneste.map((r) => (
            <div key={r.id} className="tr-dash-seneste-rad">
              <div className="tr-dash-seneste-dato">{formatDato(r.startTid)}</div>
              <div className="tr-dash-seneste-info">
                <span className="tr-dash-seneste-kat">{r.kategoriNavn}</span>
                {r.underpunktNavn && <span className="tr-dash-seneste-up"> · {r.underpunktNavn}</span>}
                {r.note && <span className="tr-dash-seneste-note"> — {r.note}</span>}
              </div>
              <div className="tr-dash-seneste-tid">
                {r.startTid && r.slutTid
                  ? `${formatKlokkeslet(r.startTid)} – ${formatKlokkeslet(r.slutTid)}`
                  : '—'}
              </div>
              <div className="tr-dash-seneste-varighed">
                {formatMinKort(r.varighedMinutter ?? 0)}
              </div>
              <button
                className="tr-ikon-btn tr-slet"
                onClick={() => { if (confirm('Slet denne registrering?')) onSlet(r.id); }}
                aria-label="Slet"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
