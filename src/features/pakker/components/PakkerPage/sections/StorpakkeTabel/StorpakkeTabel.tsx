'use client';

// src/features/pakker/components/PakkerPage/sections/StorpakkeTabel/StorpakkeTabel.tsx

import { useState } from 'react';
import { Save, Pencil } from 'lucide-react';
import type { BostedOptagelse } from '@/features/monday/services/MondayProdukterService';
import type { StorPrisRegistrering } from '@/features/pakker/services/PakkerService';
import { gemStorPris } from '@/features/pakker/services/PakkerService';

type Props = {
  bosteder: BostedOptagelse[];
  mondayIdMap: Record<string, string>;
  eksisterendePriser: StorPrisRegistrering[];
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

function måanederAktiv(startdato: string | null, tilAar: number, tilMaaned: number): number | null {
  if (!startdato) return null;
  const start = new Date(startdato);
  if (isNaN(start.getTime())) return null;
  const måneder = (tilAar - start.getFullYear()) * 12 + (tilMaaned - (start.getMonth() + 1)) + 1;
  return måneder > 0 ? måneder : null;
}

function TotalMrrRække({ bosteder, værdiFeltet }: { bosteder: BostedOptagelse[]; værdiFeltet: (navn: string) => string }) {
  let total = 0;
  let harNoget = false;
  for (const b of bosteder) {
    const pris = parseFloat(værdiFeltet(b.navn).replace(',', '.'));
    if (!isNaN(pris)) { total += pris; harNoget = true; }
  }
  return (
    <tr className="pakker-tabel-total">
      <td colSpan={4}>Total MRR</td>
      <td className="pakker-td-tal pakker-beloeb">
        {harNoget ? `${Math.round(total).toLocaleString('da-DK')} kr` : '—'}
      </td>
      <td colSpan={2} />
    </tr>
  );
}

export function StorpakkeTabel({ bosteder, mondayIdMap, eksisterendePriser }: Props) {
  const standard = nuværendeMåned();
  const [valgtAar, setValgtAar]     = useState(standard.aar);
  const [valgtMaaned, setValgtMaaned] = useState(standard.maaned);
  const [inputs, setInputs]         = useState<Record<string, string>>({});
  const [gemmer, setGemmer]         = useState<Record<string, boolean>>({});
  const [gemt, setGemt]             = useState<Record<string, string | null>>({});
  const [fejl, setFejl]             = useState<Record<string, string>>({});
  const [redigerer, setRedigerer]   = useState<Record<string, boolean>>({});

  const nøgle = (navn: string) => `${navn}__${valgtAar}__${valgtMaaned}`;

  function eksisterendePris(navn: string): StorPrisRegistrering | undefined {
    return eksisterendePriser.find(
      (r) => r.bostedNavn === navn && r.aar === valgtAar && r.maaned === valgtMaaned,
    );
  }

  function værdiFeltet(navn: string): string {
    const k = nøgle(navn);
    if (k in inputs) return inputs[k];
    const eks = eksisterendePris(navn);
    return eks != null ? String(eks.maanedligPris) : '';
  }

  async function gem(b: BostedOptagelse) {
    const k = nøgle(b.navn);
    const raw = værdiFeltet(b.navn).trim().replace(',', '.');
    const pris = parseFloat(raw);
    if (isNaN(pris) || pris < 0) {
      setFejl((f) => ({ ...f, [k]: 'Indtast en gyldig pris' }));
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
      await gemStorPris(mondayId, b.navn, valgtAar, valgtMaaned, pris);
      setGemt((g) => ({ ...g, [k]: new Date().toISOString() }));
      setRedigerer((r) => ({ ...r, [k]: false }));
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
        <span className="pakker-pakke-badge" style={{ background: '#0073ea' }}>Stor pakke</span>
        <span className="pakker-sektion-meta">
          {bosteder.length} kunder · individuel månedlig pris pr. bosted
        </span>
      </div>

      <div className="pakker-periode-vaelger">
        <label className="pakker-periode-label">Registrer for</label>
        <div className="pakker-periode-inputs">
          <select className="pakker-select" value={valgtMaaned} onChange={(e) => { setValgtMaaned(Number(e.target.value)); setInputs({}); }}>
            {MÅNEDER.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="pakker-select" value={valgtAar} onChange={(e) => { setValgtAar(Number(e.target.value)); setInputs({}); }}>
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
              <th className="pakker-th-tal">Pris/md (kr)</th>
              <th className="pakker-th-tal">Beløb</th>
              <th>Sidst opdateret</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bosteder.map((b) => {
              const k = nøgle(b.navn);
              const raw = værdiFeltet(b.navn);
              const pris = parseFloat(raw.replace(',', '.'));
              const eks = eksisterendePris(b.navn);
              const sidstOpdateret = gemt[k] ?? eks?.opdateret ?? null;
              const netopGemt = !!gemt[k];
              const mdr = måanederAktiv(b.dato, valgtAar, valgtMaaned);
              const harGemtVærdi = eks != null || netopGemt;
              const erLåst = harGemtVærdi && !redigerer[k];

              return (
                <tr key={b.navn}>
                  <td>{b.navn}</td>
                  <td>{b.dato ?? '—'}</td>
                  <td className="pakker-td-tal">{mdr != null ? `${mdr} mdr.` : '—'}</td>
                  <td className="pakker-td-tal">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className={`pakker-antal-input pakker-pris-input${erLåst ? ' låst' : ''}`}
                      value={raw}
                      placeholder="—"
                      readOnly={erLåst}
                      onChange={(e) => {
                        if (erLåst) return;
                        setInputs((prev) => ({ ...prev, [k]: e.target.value }));
                        setFejl((f) => ({ ...f, [k]: '' }));
                      }}
                    />
                    {fejl[k] && <span className="pakker-fejl">{fejl[k]}</span>}
                  </td>
                  <td className="pakker-td-tal pakker-beloeb">
                    {!isNaN(pris) ? `${Math.round(pris).toLocaleString('da-DK')} kr` : '—'}
                  </td>
                  <td className="pakker-opdateret">
                    {netopGemt
                      ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Gemt nu ✓</span>
                      : <span>{formaterDato(sidstOpdateret)}</span>
                    }
                  </td>
                  <td>
                    <div className="pakker-knap-gruppe">
                      {erLåst && (
                        <button className="pakker-rediger-knap" onClick={() => setRedigerer((r) => ({ ...r, [k]: true }))}>
                          <Pencil size={13} /> Rediger
                        </button>
                      )}
                      <button
                        className={`pakker-gem-knap${netopGemt ? ' gemt' : ''}`}
                        onClick={() => gem(b)}
                        disabled={gemmer[k] || raw === '' || erLåst}
                      >
                        {netopGemt ? '✓ Gemt' : gemmer[k] ? '…' : <><Save size={13} /> Gem</>}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <TotalMrrRække bosteder={bosteder} værdiFeltet={værdiFeltet} />
          </tfoot>
        </table>
      </div>
    </div>
  );
}
