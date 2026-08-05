'use client';
// FilterPanel.tsx — Slide-in overlay panel fra højre

import { Search, X, ChevronRight, ChevronLeft, Trash2, Pencil } from 'lucide-react';
import type { FilterState, SubPanel } from './types';
import { FUND_CFG } from './types';

type Props = {
  kladde: FilterState;
  kommuner: string[];
  subPanel: SubPanel;
  filterSøgning: string;
  onFilterSøgning: (v: string) => void;
  onSubPanel: (v: SubPanel) => void;
  onToggle: (felt: keyof FilterState, vaerdi: string) => void;
  onFjern: (felt: keyof FilterState) => void;
  onAnvend: () => void;
  onLuk: () => void;
};

const FILTER_GRUPPER = [
  {
    titel: 'Bosted',
    items: [
      { id: 'los' as SubPanel,       ikon: '👤', label: 'LOS-medlem',   felt: 'los' as keyof FilterState },
      { id: 'kommune' as SubPanel,   ikon: '📍', label: 'Kommune',      felt: 'kommuner' as keyof FilterState },
      { id: 'paragraf' as SubPanel,  ikon: '§',  label: 'Paragraf',     felt: 'paragraffer' as keyof FilterState },
    ],
  },
  {
    titel: 'Rapport',
    items: [
      { id: 'stps-rapport' as SubPanel, ikon: '📄', label: 'STPS-rapport', felt: 'stpsRapport' as keyof FilterState },
      { id: 'stps-fund' as SubPanel,    ikon: '⚠',  label: 'STPS-fund',    felt: 'stpsFund' as keyof FilterState },
    ],
  },
];

function antalAktive(kladde: FilterState): number {
  return Object.values(kladde).filter((v) => v.length > 0).length;
}

function aktiveChips(kladde: FilterState) {
  const liste: { felt: keyof FilterState; label: string; vaerdierLabel: string }[] = [];
  if (kladde.kommuner.length)   liste.push({ felt: 'kommuner',   label: 'Kommune',      vaerdierLabel: kladde.kommuner.map((k) => k.replace(' Kommune', '')).join(', ') });
  if (kladde.paragraffer.length) liste.push({ felt: 'paragraffer', label: 'Paragraf',     vaerdierLabel: kladde.paragraffer.join(', ') });
  if (kladde.los.length)         liste.push({ felt: 'los',         label: 'LOS-medlem',   vaerdierLabel: kladde.los.map((v) => v === 'ja' ? 'Ja' : 'Nej').join(', ') });
  if (kladde.stpsRapport.length) liste.push({ felt: 'stpsRapport', label: 'STPS-rapport', vaerdierLabel: kladde.stpsRapport.map((v) => v === 'ja' ? 'Ja' : 'Nej').join(', ') });
  if (kladde.stpsFund.length)    liste.push({ felt: 'stpsFund',    label: 'STPS-fund',    vaerdierLabel: kladde.stpsFund.map((v) => FUND_CFG[v]?.kortLabel ?? v).join(', ') });
  return liste;
}

export function FilterPanel({ kladde, kommuner, subPanel, filterSøgning, onFilterSøgning, onSubPanel, onToggle, onFjern, onAnvend, onLuk }: Props) {
  const antal = antalAktive(kladde);
  const chips = aktiveChips(kladde);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onLuk}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '340px',
        background: 'var(--color-surface)', zIndex: 50,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {subPanel ? (
            <button
              onClick={() => onSubPanel(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-base)', padding: 0 }}
            >
              <ChevronLeft size={18} />
              {subPanel === 'kommune' ? 'Kommune' : subPanel === 'paragraf' ? 'Paragraf' : subPanel === 'los' ? 'LOS-medlem' : subPanel === 'stps-rapport' ? 'STPS-rapport' : 'STPS-fund'}
            </button>
          ) : (
            <span style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-base)' }}>Filtre</span>
          )}
          <button onClick={onLuk} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Indhold — scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {!subPanel ? (
            <>
              {/* Søg i filtre */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Søg efter filter..."
                  value={filterSøgning}
                  onChange={(e) => onFilterSøgning(e.target.value)}
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem',
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg)', fontSize: 'var(--text-sm)',
                    color: 'var(--color-text)', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Aktive filtre */}
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                  Aktive filtre ({antal})
                </p>
                {chips.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Ingen aktive filtre</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {chips.map((chip) => (
                      <div key={chip.felt} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                      }}>
                        <div>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>{chip.label}</p>
                          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text)' }}>{chip.vaerdierLabel}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <button
                            onClick={() => { /* find subpanel for felt */ }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}
                          >
                            <Pencil size={11} /> Redigér
                          </button>
                          <button
                            onClick={() => onFjern(chip.felt)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger, #dc2626)', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}
                          >
                            <Trash2 size={11} /> Fjern
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tilgængelige filtre */}
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--fw-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                  Tilgængelige filtre
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {FILTER_GRUPPER.map((gruppe) => (
                    <div key={gruppe.titel}>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>{gruppe.titel}</p>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {gruppe.items
                          .filter((item) => !filterSøgning || item.label.toLowerCase().includes(filterSøgning.toLowerCase()))
                          .map((item) => {
                            const valgt = (kladde[item.felt] as string[]).length;
                            return (
                              <button
                                key={item.id}
                                onClick={() => onSubPanel(item.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '0.65rem 0.5rem', background: 'none', border: 'none',
                                  borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
                                  textAlign: 'left', width: '100%',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <span style={{ fontSize: '0.9rem', width: '18px', textAlign: 'center', flexShrink: 0 }}>{item.ikon}</span>
                                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{item.label}</span>
                                  {valgt > 0 && (
                                    <span style={{ fontSize: 'var(--text-xs)', background: 'var(--color-primary)', color: '#fff', borderRadius: '999px', padding: '0 0.4rem', minWidth: '18px', textAlign: 'center' }}>{valgt}</span>
                                  )}
                                </div>
                                <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Sub-panel med valgmuligheder */
            <SubPanelIndhold subPanel={subPanel} kladde={kladde} kommuner={kommuner} onToggle={onToggle} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', gap: '0.75rem',
        }}>
          <button
            onClick={onLuk}
            style={{
              flex: 1, padding: '0.65rem', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', background: 'transparent',
              fontSize: 'var(--text-sm)', color: 'var(--color-text)', cursor: 'pointer',
            }}
          >
            Luk
          </button>
          <button
            onClick={onAnvend}
            style={{
              flex: 2, padding: '0.65rem', border: 'none',
              borderRadius: 'var(--radius-md)', background: 'var(--color-primary)',
              fontSize: 'var(--text-sm)', color: '#fff', cursor: 'pointer', fontWeight: 'var(--fw-semibold)',
            }}
          >
            Anvend filtre
          </button>
        </div>
      </div>
    </>
  );
}

function SubPanelIndhold({ subPanel, kladde, kommuner, onToggle }: {
  subPanel: SubPanel;
  kladde: FilterState;
  kommuner: string[];
  onToggle: (felt: keyof FilterState, vaerdi: string) => void;
}) {
  if (subPanel === 'kommune') {
    return <ValgListe felt="kommuner" valgmuligheder={kommuner.map((k) => ({ vaerdi: k, label: k.replace(' Kommune', '') }))} kladde={kladde} onToggle={onToggle} />;
  }
  if (subPanel === 'paragraf') {
    return <ValgListe felt="paragraffer" valgmuligheder={[{ vaerdi: '§107', label: '§ 107' }, { vaerdi: '§108', label: '§ 108' }, { vaerdi: '§85', label: '§ 85' }]} kladde={kladde} onToggle={onToggle} />;
  }
  if (subPanel === 'los') {
    return <ValgListe felt="los" valgmuligheder={[{ vaerdi: 'ja', label: 'Ja — LOS-medlem' }, { vaerdi: 'nej', label: 'Nej — ikke LOS-medlem' }]} kladde={kladde} onToggle={onToggle} />;
  }
  if (subPanel === 'stps-rapport') {
    return <ValgListe felt="stpsRapport" valgmuligheder={[{ vaerdi: 'ja', label: 'Har STPS-rapport' }, { vaerdi: 'nej', label: 'Ingen STPS-rapport' }]} kladde={kladde} onToggle={onToggle} />;
  }
  if (subPanel === 'stps-fund') {
    return <ValgListe felt="stpsFund" valgmuligheder={Object.entries(FUND_CFG).map(([v, cfg]) => ({ vaerdi: v, label: cfg.label }))} kladde={kladde} onToggle={onToggle} />;
  }
  return null;
}

function ValgListe({ felt, valgmuligheder, kladde, onToggle }: {
  felt: keyof FilterState;
  valgmuligheder: { vaerdi: string; label: string }[];
  kladde: FilterState;
  onToggle: (felt: keyof FilterState, vaerdi: string) => void;
}) {
  const valgte = kladde[felt] as string[];
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {valgmuligheder.map(({ vaerdi, label }) => {
        const aktiv = valgte.includes(vaerdi);
        return (
          <button
            key={vaerdi}
            onClick={() => onToggle(felt, vaerdi)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 0.5rem', background: 'none', border: 'none',
              borderBottom: '1px solid var(--color-border)', cursor: 'pointer',
              textAlign: 'left', width: '100%',
            }}
          >
            <span style={{
              width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
              border: aktiv ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: aktiv ? 'var(--color-primary)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {aktiv && <span style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '2px', display: 'block' }} />}
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
