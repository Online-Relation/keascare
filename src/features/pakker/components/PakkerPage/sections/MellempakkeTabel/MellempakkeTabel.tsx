'use client';

// src/features/pakker/components/PakkerPage/sections/MellempakkeTabel/MellempakkeTabel.tsx

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { BostedOptagelse } from '@/features/monday/services/MondayProdukterService';
import type { BeboerRegistrering } from '@/features/pakker/services/PakkerService';
import { gemBeboerRegistrering } from '@/features/pakker/services/PakkerService';

const FAST_PRIS = 1895;
const BEBOER_PRIS = 289;

type Props = {
  bosteder: BostedOptagelse[];
  mondayIdMap: Record<string, string>; // bostedNavn → mondayItemId
  eksisterendeRegistreringer: BeboerRegistrering[];
};

const MÅNEDER = [
  'Januar','Februar','Marts','April','Maj','Juni',
  'Juli','August','September','Oktober','November','December',
];

function nuværendeMåned() {
  const nu = new Date();
  return { aar: nu.getFullYear(), maaned: nu.getMonth() + 1 };
}

export function MellempakkeTabel({ bosteder, mondayIdMap, eksisterendeRegistreringer }: Props) {
  const standard = nuværendeMåned();
  const [valgtAar, setValgtAar]     = useState(standard.aar);
  const [valgtMaaned, setValgtMaaned] = useState(standard.maaned);
  const [inputs, setInputs]         = useState<Record<string, string>>({});
  const [gemmer, setGemmer]         = useState<Record<string, boolean>>({});
  const [gemt, setGemt]             = useState<Record<string, boolean>>({});
  const [fejl, setFejl]             = useState<Record<string, string>>({});

  const nøgle = (navn: string) => `${navn}__${valgtAar}__${valgtMaaned}`;

  function eksisterendeAntal(navn: string): number | null {
    const reg = eksisterendeRegistreringer.find(
      (r) => r.bostedNavn === navn && r.aar === valgtAar && r.maaned === valgtMaaned,
    );
    return reg?.antalBeboere ?? null;
  }

  function værdiFeltet(navn: string): string {
    const k = nøgle(navn);
    if (k in inputs) return inputs[k];
    const eks = eksisterendeAntal(navn);
    return eks != null ? String(eks) : '';
  }

  async function gem(b: BostedOptagelse) {
    const k = nøgle(b.navn);
    const raw = værdiFeltet(b.navn).trim();
    const antal = parseInt(raw, 10);
    if (isNaN(antal) || antal < 0) {
      setFejl((f) => ({ ...f, [k]: 'Indtast et gyldigt tal' }));
      return;
    }
    const mondayId = mondayIdMap[b.navn];
    if (!mondayId) {
      setFejl((f) => ({ ...f, [k]: 'Mangler Monday ID' }));
      return;
    }
    setGemmer((g) => ({ ...g, [k]: true }));
    setFejl((f) => ({ ...f, [k]: '' }));
    try {
      await gemBeboerRegistrering(mondayId, b.navn, 'Mellempakke', valgtAar, valgtMaaned, antal);
      setGemt((g) => ({ ...g, [k]: true }));
      setTimeout(() => setGemt((g) => ({ ...g, [k]: false })), 2000);
    } catch {
      setFejl((f) => ({ ...f, [k]: 'Fejl ved gem' }));
    } finally {
      setGemmer((g) => ({ ...g, [k]: false }));
    }
  }

  const aar = [valgtAar - 1, valgtAar, valgtAar + 1];

  return (
    <div className="pakker-sektion">
      <div className="pakker-sektion-header">
        <span className="pakker-pakke-badge" style={{ background: '#579bfc' }}>Mellempakke</span>
        <span className="pakker-sektion-meta">{bosteder.length} kunder · {FAST_PRIS.toLocaleString('da-DK')} kr + {BEBOER_PRIS} kr × antal beboere</span>
      </div>

      {/* Periode-vælger */}
      <div className="pakker-periode-vaelger">
        <label className="pakker-periode-label">Periode</label>
        <div className="pakker-periode-inputs">
          <select
            className="pakker-select"
            value={valgtMaaned}
            onChange={(e) => { setValgtMaaned(Number(e.target.value)); setInputs({}); setGemt({}); }}
          >
            {MÅNEDER.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="pakker-select"
            value={valgtAar}
            onChange={(e) => { setValgtAar(Number(e.target.value)); setInputs({}); setGemt({}); }}
          >
            {aar.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="pakker-tabel-wrapper">
        <table className="pakker-tabel">
          <thead>
            <tr>
              <th>Bosted</th>
              <th>Startdato</th>
              <th className="pakker-th-tal">Antal beboere</th>
              <th className="pakker-th-tal">Beløb</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bosteder.map((b) => {
              const k = nøgle(b.navn);
              const raw = værdiFeltet(b.navn);
              const antal = parseInt(raw, 10);
              const beløb = !isNaN(antal) ? FAST_PRIS + BEBOER_PRIS * antal : null;
              return (
                <tr key={b.navn}>
                  <td>{b.navn}</td>
                  <td>{b.dato ?? '—'}</td>
                  <td className="pakker-td-tal">
                    <input
                      type="number"
                      min={0}
                      className="pakker-antal-input"
                      value={raw}
                      placeholder="—"
                      onChange={(e) => {
                        setInputs((prev) => ({ ...prev, [k]: e.target.value }));
                        setFejl((f) => ({ ...f, [k]: '' }));
                      }}
                    />
                    {fejl[k] && <span className="pakker-fejl">{fejl[k]}</span>}
                  </td>
                  <td className="pakker-td-tal pakker-beloeb">
                    {beløb != null ? `${beløb.toLocaleString('da-DK')} kr` : '—'}
                  </td>
                  <td>
                    <button
                      className={`pakker-gem-knap${gemt[k] ? ' gemt' : ''}`}
                      onClick={() => gem(b)}
                      disabled={gemmer[k] || raw === ''}
                      title="Gem"
                    >
                      {gemt[k] ? '✓' : gemmer[k] ? '…' : <Save size={13} />}
                    </button>
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
