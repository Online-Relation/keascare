'use client';

// src/features/pakker/components/PakkerPage/sections/MellempakkeTabel/MellempakkeTabel.tsx

import { useState } from 'react';
import { Save, Pencil, ChevronDown } from 'lucide-react';
import type { BostedOptagelse } from '@/features/monday/services/MondayProdukterService';
import type { BeboerRegistrering } from '@/features/pakker/services/PakkerService';
import { gemBeboerRegistrering } from '@/features/pakker/services/PakkerService';
import { BostedHistorik } from './BostedHistorik';
import { SorBadge } from '@/features/sor/components/SorBadge';
import type { SorCacheEnhed } from '@/features/sor/services/SorService';

const FAST_PRIS = 1895;
const BEBOER_PRIS = 289;

const MÅNEDER = [
  'Januar','Februar','Marts','April','Maj','Juni',
  'Juli','August','September','Oktober','November','December',
];

type Periode = { aar: number; maaned: number };

function nuværendeMåned(): Periode {
  const nu = new Date();
  return { aar: nu.getFullYear(), maaned: nu.getMonth() + 1 };
}

function måanederAktiv(startdato: string | null, tilAar: number, tilMaaned: number): number | null {
  if (!startdato) return null;
  const start = new Date(startdato);
  if (isNaN(start.getTime())) return null;
  const måneder = (tilAar - start.getFullYear()) * 12 + (tilMaaned - (start.getMonth() + 1)) + 1;
  return måneder > 0 ? måneder : null;
}

function formaterDato(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

type Props = {
  bosteder: BostedOptagelse[];
  mondayIdMap: Record<string, string>;
  eksisterendeRegistreringer: BeboerRegistrering[];
  sorMatchMap?: Record<string, SorCacheEnhed | null>;
};

function TotalMrrRække({ bosteder, værdiFeltet }: { bosteder: BostedOptagelse[]; værdiFeltet: (navn: string) => string }) {
  let totalMrr = 0;
  let harNoget = false;
  for (const b of bosteder) {
    const antal = parseInt(værdiFeltet(b.navn), 10);
    if (!isNaN(antal)) { totalMrr += FAST_PRIS + BEBOER_PRIS * antal; harNoget = true; }
  }
  return (
    <tr className="pakker-tabel-total">
      <td colSpan={5}>Total MRR</td>
      <td className="pakker-td-tal pakker-beloeb">{harNoget ? `${totalMrr.toLocaleString('da-DK')} kr` : '—'}</td>
      <td colSpan={2} />
    </tr>
  );
}

export function MellempakkeTabel({ bosteder, mondayIdMap, eksisterendeRegistreringer, sorMatchMap }: Props) {
  const standard = nuværendeMåned();
  const [valgtAar, setValgtAar]         = useState(standard.aar);
  const [valgtMaaned, setValgtMaaned]   = useState(standard.maaned);
  const [inputs, setInputs]             = useState<Record<string, string>>({});
  const [gemmer, setGemmer]             = useState<Record<string, boolean>>({});
  const [gemt, setGemt]                 = useState<Record<string, string | null>>({});
  const [fejl, setFejl]                 = useState<Record<string, string>>({});
  const [redigerer, setRedigerer]       = useState<Record<string, boolean>>({});
  const [redigerPeriode, setRedigerPeriode] = useState<Record<string, Periode>>({});
  const [åbenHistorik, setÅbenHistorik] = useState<string | null>(null);

  const nøgle = (navn: string) => `${navn}__${valgtAar}__${valgtMaaned}`;

  function eksisterendeReg(navn: string): BeboerRegistrering | undefined {
    return eksisterendeRegistreringer.find(
      (r) => r.bostedNavn === navn && r.aar === valgtAar && r.maaned === valgtMaaned && r.pakke === 'FMK pakke',
    );
  }

  // Finder seneste registrering FØR den valgte periode (carry-forward)
  function senesteTidligereReg(navn: string): BeboerRegistrering | undefined {
    const nuPeriodeTal = valgtAar * 12 + valgtMaaned;
    return eksisterendeRegistreringer
      .filter(
        (r) =>
          r.bostedNavn === navn &&
          r.pakke === 'FMK pakke' &&
          r.aar * 12 + r.maaned < nuPeriodeTal,
      )
      .sort((a, b) => (b.aar * 12 + b.maaned) - (a.aar * 12 + a.maaned))[0];
  }

  function værdiFeltet(navn: string): string {
    const k = nøgle(navn);
    if (k in inputs) return inputs[k];
    const eks = eksisterendeReg(navn);
    if (eks != null) return String(eks.antalBeboere);
    // Ingen registrering for denne periode — brug seneste tidligere som forslag
    const carryFwd = senesteTidligereReg(navn);
    return carryFwd != null ? String(carryFwd.antalBeboere) : '';
  }

  function erCarryForward(navn: string): BeboerRegistrering | undefined {
    if (eksisterendeReg(navn) != null) return undefined;
    const k = nøgle(navn);
    if (k in inputs) return undefined; // brugeren har ændret det
    return senesteTidligereReg(navn);
  }

  function startRediger(navn: string) {
    const k = nøgle(navn);
    setRedigerer((r) => ({ ...r, [k]: true }));
    // Initialiser per-række periode til den globale periode
    setRedigerPeriode((p) => ({ ...p, [k]: { aar: valgtAar, maaned: valgtMaaned } }));
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
    // Brug per-række periode hvis sat (rediger-tilstand), ellers global
    const periode = redigerPeriode[k] ?? { aar: valgtAar, maaned: valgtMaaned };
    setGemmer((g) => ({ ...g, [k]: true }));
    setFejl((f) => ({ ...f, [k]: '' }));
    try {
      await gemBeboerRegistrering(mondayId, b.navn, 'FMK pakke', periode.aar, periode.maaned, antal);
      setGemt((g) => ({ ...g, [k]: new Date().toISOString() }));
      setRedigerer((r) => ({ ...r, [k]: false }));
      setRedigerPeriode((p) => { const next = { ...p }; delete next[k]; return next; });
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

      <div className="pakker-periode-vaelger">
        <label className="pakker-periode-label">Vis periode</label>
        <div className="pakker-periode-inputs">
          <select className="pakker-select" value={valgtMaaned} onChange={(e) => { setValgtMaaned(Number(e.target.value)); setInputs({}); }}>
            {MÅNEDER.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="pakker-select" value={valgtAar} onChange={(e) => { setValgtAar(Number(e.target.value)); setInputs({}); }}>
            {aar.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="pakker-tabel-wrapper pakker-tabel-wrapper--stor">
        <table className="pakker-tabel">
          <thead>
            <tr>
              <th>Bosted</th>
              <th>SOR</th>
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
              const harGemtVærdi = eks != null || netopGemt;
              const erLåst = harGemtVærdi && !redigerer[k];
              const rowPeriode = redigerPeriode[k] ?? { aar: valgtAar, maaned: valgtMaaned };
              const rowAar = [rowPeriode.aar - 1, rowPeriode.aar, rowPeriode.aar + 1];
              const carryFwd = erCarryForward(b.navn);
              const carryLabel = carryFwd
                ? `Fra ${MÅNEDER[carryFwd.maaned - 1].slice(0, 3)} ${carryFwd.aar}`
                : null;

              const historikÅben = åbenHistorik === b.navn;

              return (
                <>
                <tr key={b.navn} className={historikÅben ? 'pakker-rad-aktiv' : ''}>
                  <td>
                    <button
                      className="pakker-bosted-knap"
                      onClick={() => setÅbenHistorik(historikÅben ? null : b.navn)}
                      aria-expanded={historikÅben}
                    >
                      <ChevronDown size={14} className={`pakker-chevron${historikÅben ? ' åben' : ''}`} />
                      {b.navn}
                    </button>
                  </td>
                  <td>
                    <SorBadge
                      match={sorMatchMap ? (sorMatchMap[b.navn] ?? null) : undefined}
                      ikkeIndlæst={!sorMatchMap}
                    />
                  </td>
                  <td>{b.dato ?? '—'}</td>
                  <td className="pakker-td-tal">{mdr != null ? `${mdr} mdr.` : '—'}</td>
                  <td className="pakker-td-tal">
                    <input
                      type="number"
                      min={0}
                      className={`pakker-antal-input${erLåst ? ' låst' : ''}${carryFwd ? ' carry-forward' : ''}`}
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
                    {beløb != null ? `${beløb.toLocaleString('da-DK')} kr` : '—'}
                  </td>
                  <td className="pakker-opdateret">
                    {netopGemt
                      ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Gemt nu ✓</span>
                      : carryLabel
                      ? <span className="pakker-carry-label">↩ {carryLabel}</span>
                      : <span>{formaterDato(sidstOpdateret)}</span>
                    }
                  </td>
                  <td>
                    <div className="pakker-knap-gruppe">
                      {erLåst ? (
                        <button className="pakker-rediger-knap" onClick={() => startRediger(b.navn)}>
                          <Pencil size={13} /> Rediger
                        </button>
                      ) : (
                        /* Inline periode-vælger i rediger-tilstand */
                        redigerer[k] && (
                          <div className="pakker-row-periode">
                            <select
                              className="pakker-select pakker-select-sm"
                              value={rowPeriode.maaned}
                              onChange={(e) => setRedigerPeriode((p) => ({ ...p, [k]: { ...rowPeriode, maaned: Number(e.target.value) } }))}
                            >
                              {MÅNEDER.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                            <select
                              className="pakker-select pakker-select-sm"
                              value={rowPeriode.aar}
                              onChange={(e) => setRedigerPeriode((p) => ({ ...p, [k]: { ...rowPeriode, aar: Number(e.target.value) } }))}
                            >
                              {rowAar.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                          </div>
                        )
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
                {historikÅben && (
                  <tr className="pakker-historik-rad">
                    <td colSpan={8} className="pakker-historik-celle">
                      <BostedHistorik
                        bostedNavn={b.navn}
                        registreringer={eksisterendeRegistreringer}
                      />
                    </td>
                  </tr>
                )}
                </>
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
