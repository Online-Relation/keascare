'use client';

// src/features/sor/components/SorPage/SorPage.tsx

import { useState, useMemo } from 'react';
import { ExternalLink, Database, Search, Filter } from 'lucide-react';
import type { SorCacheEnhed } from '@/features/sor/services/SorService';

type Props = {
  nyeLeads: SorCacheEnhed[];
  antalIAlt: number;
  antalKendte: number;
  sidstSynkroniseret: string | null;
  enhedstyper: { id: string; navn: string }[];
};

function formaterDato(iso: string | null): string {
  if (!iso) return 'Ikke synkroniseret endnu';
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function SorPage({ nyeLeads, antalIAlt, antalKendte, sidstSynkroniseret, enhedstyper }: Props) {
  const [søgeTekst, setSøgeTekst] = useState('');
  const [valgtType, setValgtType] = useState<string>('');

  const filtrerede = useMemo(() => {
    return nyeLeads.filter((e) => {
      if (valgtType && e.enhedstypeId !== valgtType) return false;
      if (!søgeTekst) return true;
      const s = søgeTekst.toLowerCase();
      return (
        e.navn.toLowerCase().includes(s) ||
        (e.by ?? '').toLowerCase().includes(s) ||
        (e.cvr ?? '').includes(s) ||
        (e.enhedstypeNavn ?? '').toLowerCase().includes(s)
      );
    });
  }, [nyeLeads, søgeTekst, valgtType]);

  return (
    <div className="sor-page">
      <div className="sor-page-header">
        <div>
          <h1 className="sor-page-titel">SOR Register</h1>
          <p className="sor-page-undertitel">
            Sundhedsvæsenets Organisationsregister · Sidst synkroniseret: {formaterDato(sidstSynkroniseret)}
          </p>
        </div>
      </div>

      {antalIAlt === 0 ? (
        <div className="sor-tom-boks">
          <p>Ingen SOR-data i cache endnu. Gå til <strong>Scrapers</strong> og kør SOR-sync manuelt.</p>
        </div>
      ) : (
        <>
          <div className="sor-kpi-række">
            <div className="sor-kpi">
              <span className="sor-kpi-tal">{antalIAlt.toLocaleString('da-DK')}</span>
              <span className="sor-kpi-label">Enheder i SOR</span>
            </div>
            <div className="sor-kpi">
              <span className="sor-kpi-tal" style={{ color: 'var(--color-success)' }}>{antalKendte.toLocaleString('da-DK')}</span>
              <span className="sor-kpi-label">Allerede i vores system</span>
            </div>
            <div className="sor-kpi">
              <span className="sor-kpi-tal" style={{ color: 'var(--color-accent)' }}>{nyeLeads.length.toLocaleString('da-DK')}</span>
              <span className="sor-kpi-label">Ikke i vores system</span>
            </div>
            <div className="sor-kpi">
              <span className="sor-kpi-tal">{filtrerede.length.toLocaleString('da-DK')}</span>
              <span className="sor-kpi-label">Vises efter filter</span>
            </div>
          </div>

          <div className="sor-sektion">
            <div className="sor-sektion-header">
              <h2 className="sor-sektion-titel">
                <Database size={15} />
                SOR-enheder ikke i vores system
              </h2>
              <div className="sor-filter-række">
                <div className="sor-søge-wrapper">
                  <Search size={13} className="sor-søge-ikon" />
                  <input
                    className="sor-søge-felt"
                    placeholder="Søg navn, by, CVR eller type…"
                    value={søgeTekst}
                    onChange={(e) => setSøgeTekst(e.target.value)}
                  />
                </div>
                <div className="sor-type-filter-wrapper">
                  <Filter size={13} />
                  <select
                    className="sor-type-filter"
                    value={valgtType}
                    onChange={(e) => setValgtType(e.target.value)}
                  >
                    <option value="">Alle enhedstyper</option>
                    {enhedstyper.map((t) => (
                      <option key={t.id} value={t.id}>{t.navn}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="sor-tabel-wrapper">
              <table className="sor-tabel">
                <thead>
                  <tr>
                    <th>Navn</th>
                    <th>Enhedstype</th>
                    <th>CVR</th>
                    <th>By</th>
                    <th>SOR-kode</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrerede.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1.5rem' }}>
                        Ingen resultater matcher filteret
                      </td>
                    </tr>
                  ) : (
                    filtrerede.map((e) => (
                      <tr key={e.sorKode}>
                        <td className="sor-td-navn">{e.navn}</td>
                        <td className="sor-td-type">{e.enhedstypeNavn ?? '—'}</td>
                        <td className="sor-td-mono">{e.cvr ?? '—'}</td>
                        <td>{e.postnummer && e.by ? `${e.postnummer} ${e.by}` : (e.by ?? '—')}</td>
                        <td className="sor-td-mono sor-td-kode">{e.sorKode}</td>
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
