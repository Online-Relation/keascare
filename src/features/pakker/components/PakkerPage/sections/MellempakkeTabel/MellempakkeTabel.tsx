'use client';

// src/features/pakker/components/PakkerPage/sections/MellempakkeTabel/MellempakkeTabel.tsx

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { BostedOptagelse } from '@/features/monday/services/MondayProdukterService';
import type { BeboerRegistrering } from '@/features/pakker/services/PakkerService';
import { gemBeboerRegistrering } from '@/features/pakker/services/PakkerService';

const FAST_PRIS = 1895;
const BEBOER_PRIS = 289;

function måanederAktiv(startdato: string | null, tilAar: number, tilMaaned: number): number | null {
  if (!startdato) return null;
  const start = new Date(startdato);
  if (isNaN(start.getTime())) return null;
  const startAar = start.getFullYear();
  const startMaaned = start.getMonth() + 1;
  const måneder = (tilAar - startAar) * 12 + (tilMaaned - startMaaned) + 1;
  return måneder > 0 ? måneder : null;
}

type Props = {
  bosteder: BostedOptagelse[];
  mondayIdMap: Record<string, string>;
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

function formaterDato(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function MellempakkeTabel({ bosteder, mondayIdMap, eksisterendeRegistreringer }: Props) {
  const standard = nuværendeMåned();
  const [valgtAar, setValgtAar]       = useState(standard.aar);
  const [valgtMaaned, setValgtMaaned] = useState(standard.maaned);
  const [inputs, setInputs]           = useState<Record<string, string>>({});
  const [gemmer, setGemmer]           = useState<Record<string, boolean>>({});
  const [gemt, setGemt]               = useState<Record<string, string | null>>({});
  const [fejl, setFejl]               = useState<Record<string, string>>({});

  const nøgle = (navn: string) => `${navn}__${valgtAar}__${valgtMaaned}`;

  function eksisterendeReg(navn: string): BeboerRegistrering | undefined {
    return eksisterendeRegistreringer.find(
      (r) => r.bostedNavn === navn && r.aar === valgtAar && r.maaned === valgtMaaned && r.pakke === 'FMK pakke',
    );
  }

  function værdiFeltet(navn: string): string {
    const k = nøgle(navn);
    if (k in inputs) return inputs[k];
    const eks = eksisterendeReg(navn);
    return eks != null ? String(eks.antalBeboere) : '';
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
      await gemBeboerRegistrering(mondayId, b.navn, 'FMK pakke', valgtAar, valgtMaaned, antal);
      const nu = new Date().toISOString();
      setGemt((g) => ({ ...g, [k]: nu }));
      setTimeout(() => setGemt((g) => ({ ...g, [k]: null })), 3000);
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
        <span className="pakker-pakke-badge" style={{ background: '#66ccff', color: '#1a1a2e' }}>FMK pakke</span>
        <span className="pakker-sektion-meta">
          {bosteder.length} kunder · {FAST_PRIS.toLocaleString('da-DK')} kr + {BEBOER_PRIS} kr × antal beboere
        </span>
      </div>

      {/* Periode-vælger */}
      <div className="pakker-periode-vaelger">
        <label className="pakker-periode-label">Registrer for</label>
        <div className="pakker-periode-inputs">
          <select
            className="pakker-select"
            value={valgtMaaned}
            onChange={(e) => { setValgtMaaned(Number(e.target.value)); setInputs({}); }}
          >
            {MÅNEDER.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="pakker-select"
            value={valgtAar}
            onChange={(e) => { setValgtAar(Number(e.target.value)); setInputs({}); }}
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
              <th className="pakker-th-tal">Mdr. aktiv</th>
              <th className="pakker-th-tal">Beboere</th>
              <th className="pakker-th-tal">Beløb</th>
              <th>Sidst opdateret</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bosteder.map((b) => {
              const k = nøgle(b.navn);
              const raw = værdiFeltet(b.navn);
              const antal = parseInt(raw, 10);
              const beløb = !isNaN(antal) ? FAST_PRIS + BEBOER_PRIS * antal : null;
              const eks = eksisterendeReg(b.navn);
              const sidstOpdateret = gemt[k] ?? eks?.opdateret ?? null;
              const netopGemt = !!gemt[k];
              const mdr = måanederAktiv(b.dato, valgtAar, valgtMaaned);

              return (
                <tr key={b.navn}>
                  <td>{b.navn}</td>
                  <td>{b.dato ?? '—'}</td>
                  <td className="pakker-td-tal">{mdr != null ? `${mdr} mdr.` : '—'}</td>
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
                  <td className="pakker-opdateret">
                    {netopGemt
                      ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Gemt nu ✓</span>
                      : <span>{formaterDato(sidstOpdateret)}</span>
                    }
                  </td>
                  <td>
                    <button
                      className={`pakker-gem-knap${netopGemt ? ' gemt' : ''}`}
                      onClick={() => gem(b)}
                      disabled={gemmer[k] || raw === ''}
                    >
                      {netopGemt ? '✓ Gemt' : gemmer[k] ? '…' : <><Save size={13} /> Gem</>}
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
