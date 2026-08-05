'use client';
// FilterPanel.tsx

import { Search, X, ChevronRight, ChevronLeft, Trash2, Users, MapPin, Hash, FileText, AlertTriangle } from 'lucide-react';
import type { FilterState, SubPanel } from './types';
import { FUND_CFG, RADIO_FELTER } from './types';

type Props = {
  filtre: FilterState;
  kommuner: string[];
  subPanel: SubPanel;
  filterSøgning: string;
  onFilterSøgning: (v: string) => void;
  onSubPanel: (v: SubPanel) => void;
  onToggle: (felt: keyof FilterState, vaerdi: string) => void;
  onFjern: (felt: keyof FilterState) => void;
  onLuk: () => void;
  antalResultater: number;
};

type FilterGruppeItem = {
  id: SubPanel;
  Ikon: React.ElementType;
  label: string;
  felt: keyof FilterState;
};

const FILTER_GRUPPER: { titel: string; items: FilterGruppeItem[] }[] = [
  {
    titel: 'Bosted',
    items: [
      { id: 'los',          Ikon: Users,         label: 'LOS-medlem',   felt: 'los'         },
      { id: 'kommune',      Ikon: MapPin,         label: 'Kommune',      felt: 'kommuner'    },
      { id: 'paragraf',     Ikon: Hash,           label: 'Paragraf',     felt: 'paragraffer' },
    ],
  },
  {
    titel: 'Rapport',
    items: [
      { id: 'stps-rapport', Ikon: FileText,       label: 'STPS-rapport', felt: 'stpsRapport' },
      { id: 'stps-fund',    Ikon: AlertTriangle,  label: 'STPS-fund',    felt: 'stpsFund'    },
    ],
  },
];

function antalAktive(kladde: FilterState): number {
  return Object.values(kladde).filter((v) => (v as string[]).length > 0).length;
}

type Chip = { felt: keyof FilterState; label: string; vaerdierLabel: string };

function aktiveChips(kladde: FilterState): Chip[] {
  const liste: Chip[] = [];
  if (kladde.kommuner.length)    liste.push({ felt: 'kommuner',    label: 'Kommune',      vaerdierLabel: kladde.kommuner.map((k) => k.replace(' Kommune', '')).join(', ') });
  if (kladde.paragraffer.length) liste.push({ felt: 'paragraffer', label: 'Paragraf',     vaerdierLabel: kladde.paragraffer.join(', ') });
  if (kladde.los.length)         liste.push({ felt: 'los',         label: 'LOS-medlem',   vaerdierLabel: kladde.los.map((v) => v === 'ja' ? 'Ja' : 'Nej').join(', ') });
  if (kladde.stpsRapport.length) liste.push({ felt: 'stpsRapport', label: 'STPS-rapport', vaerdierLabel: kladde.stpsRapport.map((v) => v === 'ja' ? 'Ja' : 'Nej').join(', ') });
  if (kladde.stpsFund.length)    liste.push({ felt: 'stpsFund',    label: 'STPS-fund',    vaerdierLabel: kladde.stpsFund.map((v) => FUND_CFG[v]?.kortLabel ?? v).join(', ') });
  return liste;
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '360px',
  background: '#ffffff',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
  borderLeft: '1px solid var(--color-border)',
};

export function FilterPanel({ filtre, kommuner, subPanel, filterSøgning, onFilterSøgning, onSubPanel, onToggle, onFjern, onLuk, antalResultater }: Props) {
  const antal = antalAktive(filtre);
  const chips = aktiveChips(filtre);

  const subPanelTitel: Record<NonNullable<SubPanel>, string> = {
    'kommune':      'Kommune',
    'paragraf':     'Paragraf',
    'los':          'LOS-medlem',
    'stps-rapport': 'STPS-rapport',
    'stps-fund':    'STPS-fund',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onLuk}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998 }}
      />

      {/* Panel */}
      <div style={panelStyle}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          background: '#ffffff',
        }}>
          {subPanel ? (
            <button
              onClick={() => onSubPanel(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-base)', padding: 0 }}
            >
              <ChevronLeft size={18} />
              {subPanelTitel[subPanel]}
            </button>
          ) : (
            <span style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-base)' }}>Filtre</span>
          )}
          <button
            onClick={onLuk}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: '0.25rem', borderRadius: '4px' }}
            aria-label="Luk"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scroll-indhold */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {!subPanel ? (
            <>
              {/* Søg */}
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Søg efter filter..."
                  value={filterSøgning}
                  onChange={(e) => onFilterSøgning(e.target.value)}
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem',
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                    background: '#f8fafc', fontSize: 'var(--text-sm)',
                    color: 'var(--color-text)', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Aktive filtre */}
              <div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                  Aktive filtre ({antal})
                </p>
                {chips.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    Ingen aktive filtre
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {chips.map((chip) => (
                      <div
                        key={chip.felt}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.65rem 0.875rem',
                          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                          background: '#f8fafc',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.1rem' }}>{chip.label}</p>
                          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chip.vaerdierLabel}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginLeft: '1rem', flexShrink: 0 }}>
                          <button
                            onClick={() => onFjern(chip.felt)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}
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
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                  Tilgængelige filtre
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {FILTER_GRUPPER.map((gruppe) => (
                    <div key={gruppe.titel}>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontWeight: 'var(--fw-medium)' }}>
                        {gruppe.titel}
                      </p>
                      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        {gruppe.items
                          .filter((item) => !filterSøgning || item.label.toLowerCase().includes(filterSøgning.toLowerCase()))
                          .map((item, idx, arr) => {
                            const valgt = (filtre[item.felt] as string[]).length;
                            return (
                              <button
                                key={item.id}
                                onClick={() => onSubPanel(item.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  width: '100%', padding: '0.75rem 0.875rem',
                                  background: '#ffffff', border: 'none',
                                  borderBottom: idx < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                                  cursor: 'pointer', textAlign: 'left',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                  <item.Ikon size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{item.label}</span>
                                  {valgt > 0 && (
                                    <span style={{
                                      fontSize: '0.7rem', background: 'var(--color-primary)', color: '#fff',
                                      borderRadius: '999px', padding: '0 0.45rem', lineHeight: '1.6',
                                    }}>
                                      {valgt}
                                    </span>
                                  )}
                                </div>
                                <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />
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
            <SubPanelIndhold subPanel={subPanel as NonNullable<SubPanel>} kladde={filtre} kommuner={kommuner} onToggle={onToggle} />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          background: '#ffffff',
        }}>
          <button
            onClick={onLuk}
            style={{
              width: '100%', padding: '0.7rem', border: 'none',
              borderRadius: 'var(--radius-md)', background: 'var(--color-primary)',
              fontSize: 'var(--text-sm)', color: '#fff', cursor: 'pointer',
              fontWeight: 'var(--fw-semibold)',
            }}
          >
            Vis {antalResultater} {antalResultater === 1 ? 'rapport' : 'rapporter'}
          </button>
        </div>
      </div>
    </>
  );
}

function SubPanelIndhold({ subPanel, kladde, kommuner, onToggle }: {
  subPanel: NonNullable<SubPanel>;
  kladde: FilterState;
  kommuner: string[];
  onToggle: (felt: keyof FilterState, vaerdi: string) => void;
}) {
  const config: Record<NonNullable<SubPanel>, { felt: keyof FilterState; valgmuligheder: { vaerdi: string; label: string }[] }> = {
    'kommune':      { felt: 'kommuner',    valgmuligheder: kommuner.map((k) => ({ vaerdi: k, label: k.replace(' Kommune', '') })) },
    'paragraf':     { felt: 'paragraffer', valgmuligheder: [{ vaerdi: '§107', label: '§ 107' }, { vaerdi: '§108', label: '§ 108' }, { vaerdi: '§43', label: '§ 43' }] },
    'los':          { felt: 'los',         valgmuligheder: [{ vaerdi: 'ja', label: 'Ja — LOS-medlem' }, { vaerdi: 'nej', label: 'Nej — ikke LOS-medlem' }] },
    'stps-rapport': { felt: 'stpsRapport', valgmuligheder: [{ vaerdi: 'ja', label: 'Har STPS-rapport' }, { vaerdi: 'nej', label: 'Ingen STPS-rapport' }] },
    'stps-fund':    { felt: 'stpsFund',    valgmuligheder: Object.entries(FUND_CFG).map(([v, cfg]) => ({ vaerdi: v, label: cfg.label })) },
  };

  const { felt, valgmuligheder } = config[subPanel];
  const valgte = kladde[felt] as string[];
  const erRadio = RADIO_FELTER.includes(felt);

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {valgmuligheder.map(({ vaerdi, label }: { vaerdi: string; label: string }, idx: number) => {
        const aktiv = valgte.includes(vaerdi);
        return (
          <button
            key={vaerdi}
            onClick={() => onToggle(felt, vaerdi)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
              padding: '0.8rem 0.875rem', background: aktiv ? '#EEF4FB' : '#ffffff',
              border: 'none', borderBottom: idx < valgmuligheder.length - 1 ? '1px solid var(--color-border)' : 'none',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            {erRadio ? (
              /* Radio-cirkel */
              <span style={{
                width: '17px', height: '17px', borderRadius: '50%', flexShrink: 0,
                border: aktiv ? `2px solid var(--color-primary)` : '1.5px solid var(--color-border)',
                background: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {aktiv && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', display: 'block' }} />}
              </span>
            ) : (
              /* Checkbox */
              <span style={{
                width: '17px', height: '17px', borderRadius: '4px', flexShrink: 0,
                border: aktiv ? `2px solid var(--color-primary)` : '1.5px solid var(--color-border)',
                background: aktiv ? 'var(--color-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {aktiv && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            )}
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontWeight: aktiv ? 'var(--fw-medium)' : 'var(--fw-normal)' }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
