'use client';

// src/features/tidsregistrering/components/TidsregistreringPage/TidsregistreringPage.tsx

import { useState } from 'react';
import { TimeDashboard } from './sections/TimeDashboard';
import { RegistreringerTabel } from './sections/RegistreringerTabel';
import { KategoriAdmin } from './sections/KategoriAdmin';

type Fane = 'dashboard' | 'registreringer' | 'kategorier';

export function TidsregistreringPage() {
  const [fane, setFane] = useState<Fane>('dashboard');

  return (
    <div className="tr-page">
      {fane !== 'dashboard' && (
        <div className="tr-page-header">
          <h1 className="tr-page-titel">Tidsregistrering</h1>
        </div>
      )}

      <div className="tr-faner">
        <button className={`tr-fane${fane === 'dashboard' ? ' aktiv' : ''}`} onClick={() => setFane('dashboard')}>
          Dashboard
        </button>
        <button className={`tr-fane${fane === 'registreringer' ? ' aktiv' : ''}`} onClick={() => setFane('registreringer')}>
          Registreringer
        </button>
        <button className={`tr-fane${fane === 'kategorier' ? ' aktiv' : ''}`} onClick={() => setFane('kategorier')}>
          Kategorier
        </button>
      </div>

      {fane === 'dashboard' && <TimeDashboard onSeAlle={() => setFane('registreringer')} />}
      {fane === 'registreringer' && <RegistreringerTabel />}
      {fane === 'kategorier' && <KategoriAdmin />}
    </div>
  );
}
