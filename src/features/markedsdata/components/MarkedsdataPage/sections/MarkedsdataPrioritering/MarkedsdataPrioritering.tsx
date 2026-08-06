'use client';
// src/features/markedsdata/components/MarkedsdataPage/sections/MarkedsdataPrioritering/MarkedsdataPrioritering.tsx

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { MarkedsdataBosted, KommuneMarked } from '@/features/markedsdata/types/markedsdata.types';

type Props = {
  bosteder: MarkedsdataBosted[];
  kommuner: KommuneMarked[];
};

type Filter = 'alle' | 'kritiske' | 'aldrig' | 'ikke_los' | 'kunder';

const FILTER_TABS: { id: Filter; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'kritiske', label: 'Kritiske fund' },
  { id: 'aldrig', label: 'Aldrig kontaktet' },
  { id: 'ikke_los', label: 'Ikke LOS' },
  { id: 'kunder', label: 'Kunder' },
];

function fundBadge(niveau: string | null) {
  if (niveau === 'kritisk') return <span className="md-fund-badge md-fund-badge--kritisk">Kritisk</span>;
  if (niveau === 'stoerre') return <span className="md-fund-badge md-fund-badge--stoerre">Større</span>;
  if (niveau === 'mindre') return <span className="md-fund-badge md-fund-badge--mindre">Mindre</span>;
  if (niveau === 'ingen') return <span className="md-fund-badge md-fund-badge--ingen">Ingen fund</span>;
  return <span className="md-fund-badge md-fund-badge--ukendt">Ukendt</span>;
}

function relativDato(isoString: string | null): string {
  if (!isoString) return 'Aldrig';
  const dage = Math.floor((Date.now() - new Date(isoString).getTime()) / 86_400_000);
  if (dage < 1) return 'I dag';
  if (dage < 30) return `${dage} dage siden`;
  const måneder = Math.floor(dage / 30);
  return `${måneder} mdr. siden`;
}

function hvorforNu(b: MarkedsdataBosted): string {
  if (b.fundNiveau === 'kritisk') return 'Kritisk fund';
  if (b.fundNiveau === 'stoerre') return 'Større fund · Opfølgning';
  if (!b.erKunde) return 'Aldrig kontaktet';
  if (b.losMedlem === false) return 'Ikke LOS · God timing';
  return 'Opfølgning';
}

function KommuneBar({ kommune, kommuner }: { kommune: string | null; kommuner: KommuneMarked[] }) {
  const km = kommuner.find((k) => k.kommune === kommune);
  if (!km || km.antalBosteder === 0) return <span className="md-tabel-muted">—</span>;
  const kundeW = (km.antalKunder / km.antalBosteder) * 100;
  const urørtW = (km.antalUrørt / km.antalBosteder) * 100;
  return (
    <div className="md-kommune-bar-row">
      <div className="md-kommune-bar-mini">
        <div style={{ width: `${kundeW}%`, background: '#22c55e', height: '100%', borderRadius: '2px 0 0 2px' }} />
        <div style={{ width: `${urørtW}%`, background: '#e2e8f0', height: '100%', borderRadius: '0 2px 2px 0' }} />
      </div>
      <span className="md-tabel-muted">{km.antalKunder}/{km.antalBosteder}</span>
    </div>
  );
}

export function MarkedsdataPrioritering({ bosteder, kommuner }: Props) {
  const [aktivFilter, setAktivFilter] = useState<Filter>('alle');

  const filtrerede = useMemo(() => {
    // "Alle" betyder her: alle markedssignaler — dvs. bosteder der IKKE allerede
    // er kunde i Monday. Allerede-matchede kunder er ikke et signal, kun
    // "Kunder"-fanen skal vise dem, samme princip som hovedtabellen på forsiden.
    let liste = aktivFilter === 'kunder' ? bosteder : bosteder.filter((b) => !b.erKunde);
    if (aktivFilter === 'kritiske') liste = liste.filter((b) => b.fundNiveau === 'kritisk' || b.fundNiveau === 'stoerre');
    if (aktivFilter === 'ikke_los') liste = liste.filter((b) => b.losMedlem === false);
    if (aktivFilter === 'kunder') liste = liste.filter((b) => b.erKunde);
    return liste.slice(0, 200);
  }, [bosteder, aktivFilter]);

  return (
    <div className="md-sektion">
      <div className="md-sektion-header">
        <span className="md-sektion-nr">2</span>
        <div>
          <h2 className="md-sektion-titel">Hvilke bosteder bør vi prioritere?</h2>
          <p className="md-sektion-sub">En prioriteret liste over bosteder baseret på fund, relation, kontaktstatus og markedsmulighed.</p>
        </div>
      </div>

      <div className="md-filter-tabs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`md-filter-tab ${aktivFilter === tab.id ? 'md-filter-tab--aktiv' : ''}`}
            onClick={() => setAktivFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <span className="md-filter-antal">{filtrerede.length} bosteder</span>
      </div>

      <div className="md-tabel-wrapper">
        <table className="md-tabel">
          <thead>
            <tr>
              <th>Bosted</th>
              <th>Kommune</th>
              <th>Fundniveau</th>
              <th>Seneste rapport</th>
              <th>LOS i kommune</th>
              <th>Kommunefremdrift</th>
              <th>Hvorfor nu?</th>
              <th>Handling</th>
            </tr>
          </thead>
          <tbody>
            {filtrerede.map((b) => {
              const km = kommuner.find((k) => k.kommune === b.kommune);
              return (
                <tr key={b.id}>
                  <td>
                    <Link href={`/dashboard/bosteder/${b.id}`} className="md-tabel-link">
                      {b.navn}
                    </Link>
                  </td>
                  <td className="md-tabel-muted">{b.kommune ?? '—'}</td>
                  <td>{fundBadge(b.fundNiveau)}</td>
                  <td className="md-tabel-muted">{relativDato(b.rapportDato)}</td>
                  <td className="md-tabel-muted">
                    {km ? `${km.antalLos} af ${km.antalBosteder}` : '—'}
                  </td>
                  <td>
                    <KommuneBar kommune={b.kommune} kommuner={kommuner} />
                  </td>
                  <td>
                    <span className="md-hvorfor">{hvorforNu(b)}</span>
                  </td>
                  <td>
                    <Link href={`/dashboard/bosteder/${b.id}`} className="md-handling-knap">
                      Åbn bosted <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
