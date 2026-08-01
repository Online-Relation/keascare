'use client';

// src/features/sor/components/SorPage/SorPage.tsx

import { useState } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import type { SorCacheEnhed } from '@/features/sor/services/SorService';

type Props = {
  nyeLeads: SorCacheEnhed[];
  antalIAlt: number;
  sidstSynkroniseret: string | null;
};

function formaterDato(iso: string | null): string {
  if (!iso) return 'Aldrig';
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function SorPage({ nyeLeads: initialLeads, antalIAlt, sidstSynkroniseret: initialSynk }: Props) {
  const [synker, setSynker] = useState(false);
  const [synkStatus, setSynkStatus] = useState<string | null>(null);
  const [sidstSynk, setSidstSynk] = useState(initialSynk);
  const [nyeLeads, setNyeLeads] = useState(initialLeads);
  const [søgeTekst, setSøgeTekst] = useState('');

  async function kørSync() {
    setSynker(true);
    setSynkStatus(null);
    try {
      const res = await fetch('/api/sor/sync', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setSynkStatus(`✓ Synkroniseret ${json.synkroniseret} enheder`);
        setSidstSynk(new Date().toISOString());
        window.location.reload();
      } else {
        setSynkStatus(`Fejl: ${json.fejl}`);
      }
    } catch {
      setSynkStatus('Netværksfejl ved synkronisering');
    } finally {
      setSynker(false);
    }
  }

  const filtreredeLeads = nyeLeads.filter((e) =>
    !søgeTekst || e.navn.toLowerCase().includes(søgeTekst.toLowerCase()) ||
    (e.by ?? '').toLowerCase().includes(søgeTekst.toLowerCase()) ||
    (e.cvr ?? '').includes(søgeTekst)
  );

  return (
    <div className="sor-page">
      <div className="sor-page-header">
        <div>
          <h1 className="sor-page-titel">SOR Register</h1>
          <p className="sor-page-undertitel">
            Sundhedsvæsenets Organisationsregister · {antalIAlt} enheder i cache
          </p>
        </div>
        <div className="sor-sync-boks">
          <span className="sor-sync-dato">Sidst synk: {formaterDato(sidstSynk)}</span>
          <button className="sor-sync-knap" onClick={kørSync} disabled={synker}>
            <RefreshCw size={14} className={synker ? 'sor-spin' : ''} />
            {synker ? 'Synkroniserer…' : 'Synkroniser nu'}
          </button>
          {synkStatus && <span className="sor-sync-status">{synkStatus}</span>}
        </div>
      </div>

      {antalIAlt === 0 ? (
        <div className="sor-tom-boks">
          <p>Ingen SOR-data i cache endnu. Klik <strong>Synkroniser nu</strong> for at hente fra SOR API.</p>
        </div>
      ) : (
        <>
          <div className="sor-kpi-række">
            <div className="sor-kpi">
              <span className="sor-kpi-tal">{antalIAlt.toLocaleString('da-DK')}</span>
              <span className="sor-kpi-label">Enheder i SOR</span>
            </div>
            <div className="sor-kpi">
              <span className="sor-kpi-tal" style={{ color: '#0073ea' }}>{nyeLeads.length.toLocaleString('da-DK')}</span>
              <span className="sor-kpi-label">Potentielle nye leads</span>
            </div>
          </div>

          <div className="sor-sektion">
            <div className="sor-sektion-header">
              <h2 className="sor-sektion-titel">SOR-bosteder ikke i Monday</h2>
              <input
                className="sor-søge-felt"
                placeholder="Søg navn, by eller CVR…"
                value={søgeTekst}
                onChange={(e) => setSøgeTekst(e.target.value)}
              />
            </div>

            <div className="sor-tabel-wrapper">
              <table className="sor-tabel">
                <thead>
                  <tr>
                    <th>Navn</th>
                    <th>CVR</th>
                    <th>Adresse</th>
                    <th>By</th>
                    <th>SOR-kode</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtreredeLeads.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1.5rem' }}>Ingen resultater</td></tr>
                  ) : (
                    filtreredeLeads.map((e) => (
                      <tr key={e.sorKode}>
                        <td className="sor-td-navn">{e.navn}</td>
                        <td className="sor-td-mono">{e.cvr ?? '—'}</td>
                        <td>{e.adresse ?? '—'}</td>
                        <td>{e.postnummer && e.by ? `${e.postnummer} ${e.by}` : (e.by ?? '—')}</td>
                        <td className="sor-td-mono">{e.sorKode}</td>
                        <td>
                          <a
                            href={`https://organisation.nsi.dk/Sor/Details/${e.sorKode}`}
                            target="_blank"
                            rel="noreferrer"
                            className="sor-link-knap"
                            title="Åbn i SOR"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
