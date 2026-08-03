'use client';

// src/features/varsletTilsyn/components/VarsletTilsynPage/VarsletTilsynPage.tsx

import Link from 'next/link';
import { Bell, MapPin, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { VarsletTilsyn } from '@/features/varsletTilsyn/types/varsletTilsyn.types';

type Props = { varslinger: VarsletTilsyn[] };

export function VarsletTilsynPage({ varslinger: initial }: Props) {
  const [varslinger, setVarslinger] = useState(initial);

  async function fjern(id: string) {
    if (!confirm('Fjern varslingen?')) return;
    await fetch(`/api/varslet-tilsyn/${id}`, { method: 'DELETE' });
    setVarslinger((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <div className="dashboard-content">
      <div className="varslet-side-header">
        <Bell size={20} className="varslet-side-ikon" />
        <div>
          <h1 className="varslet-side-titel">Varslede tilsyn</h1>
          <p className="varslet-side-beskrivelse">
            Bosteder der har modtaget et varslet tilsyn fra STPS. Klik ind for at se hvilke inspektører der sandsynligvis kommer.
          </p>
        </div>
      </div>

      {varslinger.length === 0 ? (
        <div className="varslet-ingen">
          <Bell size={32} className="varslet-ingen-ikon" />
          <p>Ingen varslede tilsyn endnu.</p>
          <p className="varslet-ingen-sub">Gå ind på et bosted og tryk "Varslet tilsyn?" for at tilføje det her.</p>
        </div>
      ) : (
        <div className="varslet-liste">
          {varslinger.map((v) => (
            <div key={v.id} className="varslet-kort">
              <Link href={`/dashboard/varslet-tilsyn/${v.id}`} className="varslet-kort-link">
                <div className="varslet-kort-info">
                  <span className="varslet-kort-navn">{v.bostedNavn}</span>
                  <div className="varslet-kort-meta">
                    {v.kommune && (
                      <span className="varslet-kort-meta-item">
                        <MapPin size={12} />
                        {v.kommune}
                      </span>
                    )}
                    <span className="varslet-kort-meta-item">
                      <Calendar size={12} />
                      Varslet {new Date(v.oprettetDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {v.noter && <span className="varslet-kort-noter">{v.noter}</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="varslet-kort-pil" />
              </Link>
              <button
                className="varslet-kort-slet"
                onClick={() => fjern(v.id)}
                title="Fjern varsling"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
