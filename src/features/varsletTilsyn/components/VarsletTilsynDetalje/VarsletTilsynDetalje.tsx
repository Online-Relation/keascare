'use client';

// src/features/varsletTilsyn/components/VarsletTilsynDetalje/VarsletTilsynDetalje.tsx

import { useState } from 'react';
import Link from 'next/link';
import { Bell, MapPin, Users, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { InspektoerAvatar } from '@/features/stps/components/InspektoerSide/InspektoerAvatar';
import type { VarsletTilsyn } from '@/features/varsletTilsyn/types/varsletTilsyn.types';
import type { SandsynligInspektoer } from '@/features/varsletTilsyn/types/varsletTilsyn.types';

type Props = {
  varsling: VarsletTilsyn;
  sandsynligeInspektoerer: SandsynligInspektoer[];
};

export function VarsletTilsynDetalje({ varsling, sandsynligeInspektoerer }: Props) {
  const [noter, setNoter] = useState(varsling.noter ?? '');
  const [gemt, setGemt] = useState(false);
  const [gemmer, setGemmer] = useState(false);

  async function gemNoter() {
    setGemmer(true);
    await fetch(`/api/varslet-tilsyn/${varsling.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noter }),
    });
    setGemmer(false);
    setGemt(true);
    setTimeout(() => setGemt(false), 2000);
  }

  async function fjernVarsling() {
    if (!confirm('Fjern varslingen for dette bosted?')) return;
    await fetch(`/api/varslet-tilsyn/${varsling.id}`, { method: 'DELETE' });
    window.location.href = '/dashboard/varslet-tilsyn';
  }

  return (
    <div className="dashboard-content">
      <div className="varslet-detalje-tilbage">
        <Link href="/dashboard/varslet-tilsyn" className="varslet-tilbage-link">
          <ArrowLeft size={14} />
          Alle varslinger
        </Link>
      </div>

      <div className="varslet-detalje-header">
        <Bell size={20} className="varslet-side-ikon" />
        <div>
          <h1 className="varslet-side-titel">{varsling.bostedNavn}</h1>
          <div className="varslet-detalje-meta">
            {varsling.kommune && (
              <span className="varslet-kort-meta-item">
                <MapPin size={12} />
                {varsling.kommune}
              </span>
            )}
            <span className="varslet-kort-meta-item">
              Varslet {new Date(varsling.oprettetDato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm varslet-fjern-knap" onClick={fjernVarsling} title="Fjern varsling">
          <Trash2 size={14} />
          Fjern varsling
        </button>
      </div>

      <div className="varslet-detalje-grid">
        {/* Sandsynlige inspektører */}
        <div className="varslet-detalje-sektion">
          <div className="varslet-sektion-header">
            <Users size={16} />
            <h2 className="varslet-sektion-titel">Sandsynlige inspektører</h2>
          </div>
          {sandsynligeInspektoerer.length === 0 ? (
            <p className="varslet-ingen-inspektoerer">
              Vi har ingen historik på tilsyn i {varsling.kommune ?? 'denne kommune'} endnu.
            </p>
          ) : (
            <div className="varslet-insp-liste">
              {sandsynligeInspektoerer.map((ins) => (
                <Link
                  key={ins.slug}
                  href={`/dashboard/rapporter/inspektoerer/${ins.slug}`}
                  className="varslet-insp-kort"
                >
                  <InspektoerAvatar slug={ins.slug} navn={ins.navn} size={40} />
                  <div className="varslet-insp-tekst">
                    <span className="varslet-insp-navn">{ins.navn}</span>
                    {ins.titel && <span className="varslet-insp-titel">{ins.titel}</span>}
                    <span className="varslet-insp-sub">
                      {ins.antalIKommune} tilsyn i kommunen
                      {ins.typiskMed.length > 0 && ` · typisk med ${ins.typiskMed[0]}`}
                    </span>
                  </div>
                  <div className="varslet-insp-sandsynlighed">
                    <span className="varslet-insp-pct">{ins.score}×</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <p className="varslet-insp-forklaring">
            Baseret på hvem der tidligere har ført tilsyn i {varsling.kommune ?? 'kommunen'} og hvem de typisk arbejder sammen med.
          </p>
        </div>

        {/* Noter */}
        <div className="varslet-detalje-sektion">
          <h2 className="varslet-sektion-titel">Forberedelsesnoter</h2>
          <textarea
            className="varslet-noter-felt"
            value={noter}
            onChange={(e) => setNoter(e.target.value)}
            placeholder="Tilføj noter til forberedelsen — fx kontaktperson, særlige fokusområder, seneste dialog…"
            rows={8}
          />
          <button
            className="btn btn-primary btn-sm varslet-gem-knap"
            onClick={gemNoter}
            disabled={gemmer}
          >
            <Save size={14} />
            {gemt ? '✓ Gemt' : 'Gem noter'}
          </button>
        </div>
      </div>
    </div>
  );
}
