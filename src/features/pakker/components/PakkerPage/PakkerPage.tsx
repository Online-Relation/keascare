'use client';

// src/features/pakker/components/PakkerPage/PakkerPage.tsx

import { useState } from 'react';
import type { ProdukterResultat } from '@/features/monday/services/MondayProdukterService';
import type { BeboerRegistrering, StorPrisRegistrering } from '@/features/pakker/services/PakkerService';
import { BasispakkeTabel } from './sections/BasispakkeTabel/BasispakkeTabel';
import { MellempakkeTabel } from './sections/MellempakkeTabel/MellempakkeTabel';
import { StorpakkeTabel } from './sections/StorpakkeTabel/StorpakkeTabel';

type Props = {
  data: ProdukterResultat;
  mondayIdMap: Record<string, string>;
  registreringer: BeboerRegistrering[];
  storPriser: StorPrisRegistrering[];
};

function SeedJuliKnap() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'fejl'>('idle');
  const [resultat, setResultat] = useState<string>('');

  async function kørSeed() {
    setStatus('loading');
    try {
      const res = await fetch('/api/pakker/seed-juli', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setResultat(`Indsat: ${json.indsat}. Ikke matchet: ${json.ikkeMatchet?.join(', ') || 'ingen'}`);
        setStatus('ok');
      } else {
        setResultat(json.fejl ?? 'Ukendt fejl');
        setStatus('fejl');
      }
    } catch {
      setResultat('Netværksfejl');
      setStatus('fejl');
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.75rem 1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '0.82rem' }}>
      <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Indsæt Juli 2026 beboerdata:</span>
      <button
        onClick={kørSeed}
        disabled={status === 'loading'}
        style={{ background: '#0073ea', color: '#fff', border: 'none', borderRadius: '7px', padding: '0.4rem 1rem', fontWeight: 600, cursor: status === 'loading' ? 'default' : 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}
      >
        {status === 'loading' ? 'Indlæser…' : 'Kør seed'}
      </button>
      {resultat && (
        <span style={{ color: status === 'ok' ? '#16a34a' : '#ef4444' }}>{resultat}</span>
      )}
      {status === 'ok' && (
        <button onClick={() => window.location.reload()} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '7px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem' }}>
          Genindlæs siden
        </button>
      )}
    </div>
  );
}

export function PakkerPage({ data, mondayIdMap, registreringer, storPriser }: Props) {
  const basispakke  = data.linjer.find((l) => l.produkt === 'Basispakke');
  const mellempakke = data.linjer.find((l) => l.produkt === 'FMK pakke');
  const storpakke   = data.linjer.find((l) => l.produkt === 'Stor pakke');

  return (
    <div className="pakker-page">
      <div className="pakker-page-header">
        <h1 className="pakker-page-titel">Pakkeoverblik</h1>
        <p className="pakker-page-undertitel">Registrer beboere og se hvilke pakker kunderne er på</p>
      </div>

      <SeedJuliKnap />

      {storpakke && storpakke.bosteder.length > 0 && (
        <StorpakkeTabel
          bosteder={storpakke.bosteder}
          mondayIdMap={mondayIdMap}
          eksisterendePriser={storPriser}
        />
      )}

      {mellempakke && mellempakke.bosteder.length > 0 && (
        <MellempakkeTabel
          bosteder={mellempakke.bosteder}
          mondayIdMap={mondayIdMap}
          eksisterendeRegistreringer={registreringer}
        />
      )}

      {basispakke && basispakke.bosteder.length > 0 && (
        <BasispakkeTabel bosteder={basispakke.bosteder} />
      )}
    </div>
  );
}
