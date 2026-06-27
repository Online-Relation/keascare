// src/features/monday/components/MondayOversigt/MondayOversigt.tsx

'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Users } from 'lucide-react';

type UkendtItem = {
  navn: string;
  gruppe: string;
  mondayId: string;
};

type MatchResultat = {
  hentetFraMonday: number;
  matchetTilStps: number;
  ingenMatch: number;
  ukendte: UkendtItem[];
};

export function MondayOversigt() {
  const [kører, setKører] = useState(false);
  const [resultat, setResultat] = useState<MatchResultat | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);

  async function kørMatch() {
    setKører(true);
    setFejl(null);
    setResultat(null);

    try {
      const res = await fetch('/api/scrapers/monday/match', { method: 'POST' });
      const data = await res.json() as MatchResultat & { ok: boolean; fejl?: string };

      if (!data.ok) {
        setFejl(data.fejl ?? 'Ukendt fejl');
      } else {
        setResultat(data);
      }
    } catch (err) {
      setFejl(String(err));
    } finally {
      setKører(false);
    }
  }

  return (
    <div className="mon-kort" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} style={{ color: 'var(--color-primary)' }} />
          <h2 className="mon-kort-titel" style={{ margin: 0 }}>Monday — Kundestatus</h2>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={kørMatch}
          disabled={kører}
        >
          <RefreshCw size={13} className={kører ? 'spin' : ''} />
          {kører ? 'Opdaterer…' : 'Opdater match'}
        </button>
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Henter alle Bosted-kunder fra Monday (Nye Forløb + Aktive Forløb) og matcher dem mod bosteder i STPS-databasen på navn.
      </p>

      {fejl && (
        <div className="mon-fejl" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={14} />
          <span>{fejl}</span>
        </div>
      )}

      {resultat && (
        <>
          <div className="mon-kpi-grid" style={{ marginBottom: '1rem' }}>
            <div className="mon-kpi">
              <div>
                <div className="mon-kpi-tal">{resultat.hentetFraMonday}</div>
                <div className="mon-kpi-label">Kunder i Monday</div>
              </div>
            </div>
            <div className="mon-kpi">
              <div>
                <div className="mon-kpi-tal" style={{ color: '#15803d' }}>{resultat.matchetTilStps}</div>
                <div className="mon-kpi-label">Matchet i STPS</div>
              </div>
            </div>
            <div className="mon-kpi">
              <div>
                <div className="mon-kpi-tal" style={{ color: resultat.ingenMatch > 0 ? '#b45309' : 'inherit' }}>
                  {resultat.ingenMatch}
                </div>
                <div className="mon-kpi-label">Ingen STPS-match</div>
              </div>
            </div>
          </div>

          {resultat.ukendte.length > 0 && (
            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                Monday-kunder uden match i STPS ({resultat.ukendte.length}):
              </p>
              <div className="mon-gruppe-liste">
                {resultat.ukendte.map((item) => (
                  <div key={item.mondayId} className="mon-gruppe-række">
                    <AlertCircle size={12} style={{ color: '#b45309', flexShrink: 0 }} />
                    <span className="mon-gruppe-navn">{item.navn}</span>
                    <span className="mon-gruppe-antal" style={{ color: 'var(--color-text-muted)' }}>{item.gruppe}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultat.ukendte.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontSize: 'var(--text-xs)' }}>
              <CheckCircle size={14} />
              Alle Monday-kunder er matchet i STPS-databasen.
            </div>
          )}
        </>
      )}

      {!resultat && !fejl && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Klik "Opdater match" for at synkronisere med Monday.
        </p>
      )}
    </div>
  );
}
