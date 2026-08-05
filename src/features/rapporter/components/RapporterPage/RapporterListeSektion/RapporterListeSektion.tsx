'use client';
// src/features/rapporter/components/RapporterPage/RapporterListeSektion/RapporterListeSektion.tsx

import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, X, ExternalLink } from 'lucide-react';
import type { RapportRække, FundNiveau } from '@/features/rapporter/types/rapporter.types';

const PR_SIDE = 25;

type SortValg = 'nyeste' | 'aeldste' | 'navn' | 'fund';

const FUND_CFG: Record<FundNiveau, { label: string; cls: string }> = {
  kritisk: { label: 'Kritisk',  cls: 'badge-kritisk' },
  stoerre: { label: 'Større',   cls: 'badge-stoerre' },
  mindre:  { label: 'Mindre',   cls: 'badge-mindre'  },
  ingen:   { label: 'Ingen',    cls: 'badge-ingen'   },
  ukendt:  { label: 'Ukendt',   cls: 'badge-ukendt'  },
};

const FUND_ORDEN: FundNiveau[] = ['kritisk', 'stoerre', 'mindre', 'ingen', 'ukendt'];

type AktivFilter = {
  type: 'fund' | 'paragraf' | 'los' | 'stps' | 'kommune';
  vaerdi: string;
  label: string;
};

type Props = { rapporter: RapportRække[] };

export function RapporterListeSektion({ rapporter }: Props) {
  const [søgning, setSøgning] = useState('');
  const [sortering, setSortering] = useState<SortValg>('nyeste');
  const [aktiveFiltre, setAktiveFiltre] = useState<AktivFilter[]>([]);
  const [filterPanelaaben, setFilterPanelaaben] = useState(false);
  const [side, setSide] = useState(1);

  // Unikke kommuner til filter
  const kommuner = useMemo(() => {
    const unikke = [...new Set(rapporter.map((r) => r.kommune).filter(Boolean) as string[])];
    return unikke.sort();
  }, [rapporter]);

  function tilfoejFilter(f: AktivFilter) {
    setAktiveFiltre((prev) => {
      const findes = prev.some((p) => p.type === f.type && p.vaerdi === f.vaerdi);
      if (findes) return prev;
      return [...prev, f];
    });
    setSide(1);
  }

  function fjernFilter(type: string, vaerdi: string) {
    setAktiveFiltre((prev) => prev.filter((f) => !(f.type === type && f.vaerdi === vaerdi)));
    setSide(1);
  }

  function nulstilFiltre() {
    setAktiveFiltre([]);
    setSøgning('');
    setSide(1);
  }

  const harAktivFilter = (type: string, vaerdi: string) =>
    aktiveFiltre.some((f) => f.type === type && f.vaerdi === vaerdi);

  const filtrerede = useMemo(() => {
    let liste = rapporter;

    // Søgning
    if (søgning.trim()) {
      const s = søgning.toLowerCase();
      liste = liste.filter(
        (r) => r.navn.toLowerCase().includes(s) || (r.kommune ?? '').toLowerCase().includes(s)
      );
    }

    // Aktive filtre
    for (const f of aktiveFiltre) {
      if (f.type === 'fund')   liste = liste.filter((r) => r.fundNiveau === f.vaerdi);
      if (f.type === 'paragraf') liste = liste.filter((r) => r.paragraf === f.vaerdi);
      if (f.type === 'los')    liste = liste.filter((r) => r.losmedlem === (f.vaerdi === 'ja'));
      if (f.type === 'stps')   liste = liste.filter((r) => r.harStpsRapport === (f.vaerdi === 'ja'));
      if (f.type === 'kommune') liste = liste.filter((r) => r.kommune === f.vaerdi);
    }

    // Sortering
    return [...liste].sort((a, b) => {
      if (sortering === 'nyeste') return (b.rapportDato ?? '').localeCompare(a.rapportDato ?? '');
      if (sortering === 'aeldste') return (a.rapportDato ?? '').localeCompare(b.rapportDato ?? '');
      if (sortering === 'navn')   return a.navn.localeCompare(b.navn, 'da');
      if (sortering === 'fund')   return FUND_ORDEN.indexOf(a.fundNiveau) - FUND_ORDEN.indexOf(b.fundNiveau);
      return 0;
    });
  }, [rapporter, søgning, aktiveFiltre, sortering]);

  const antalSider = Math.max(1, Math.ceil(filtrerede.length / PR_SIDE));
  const sidenummer = Math.min(side, antalSider);
  const synlige = filtrerede.slice((sidenummer - 1) * PR_SIDE, sidenummer * PR_SIDE);

  function formatDato(dato: string | null): string {
    if (!dato) return '—';
    return new Date(dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

      {/* ── Venstre: Hoved-indhold ─────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Søgebar */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{
            position: 'absolute', left: '0.75rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Søg bosted eller kommune…"
            value={søgning}
            onChange={(e) => { setSøgning(e.target.value); setSide(1); }}
            style={{
              width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)', fontSize: 'var(--text-sm)',
              color: 'var(--color-text)', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Aktive filter-chips + Tilføj/Nulstil */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          {aktiveFiltre.map((f) => (
            <span
              key={`${f.type}-${f.vaerdi}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.25rem 0.6rem', borderRadius: '999px',
                background: 'var(--color-primary)', color: '#fff',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)',
              }}
            >
              {f.label}
              <button
                onClick={() => fjernFilter(f.type, f.vaerdi)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}
                aria-label={`Fjern filter ${f.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}

          <button
            onClick={() => setFilterPanelaaben((v) => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.25rem 0.75rem', borderRadius: '999px',
              border: '1px dashed var(--color-border)', background: 'transparent',
              fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={12} />
            Tilføj filter
          </button>

          {aktiveFiltre.length > 0 && (
            <button
              onClick={nulstilFiltre}
              style={{
                padding: '0.25rem 0.75rem', borderRadius: '999px',
                border: '1px solid var(--color-border)', background: 'transparent',
                fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', cursor: 'pointer',
              }}
            >
              Nulstil
            </button>
          )}
        </div>

        {/* Resultater + sortering */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {filtrerede.length} {filtrerede.length === 1 ? 'rapport' : 'rapporter'}
          </span>
          <select
            value={sortering}
            onChange={(e) => { setSortering(e.target.value as SortValg); setSide(1); }}
            style={{
              padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              fontSize: 'var(--text-xs)', color: 'var(--color-text)', cursor: 'pointer',
            }}
          >
            <option value="nyeste">Nyeste først</option>
            <option value="aeldste">Ældste først</option>
            <option value="navn">Bostedsnavn A-Z</option>
            <option value="fund">Fund (alvorligste)</option>
          </select>
        </div>

        {/* Tabel */}
        <div className="dashboard-table-wrapper" style={{ margin: 0 }}>
          {filtrerede.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.5rem',
            }}>
              <Search size={20} />
              <span>Ingen rapporter matcher søgningen</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bosted</th>
                    <th>Kommune</th>
                    <th>Paragraf</th>
                    <th>LOS</th>
                    <th>STPS-rapport</th>
                    <th>STPS-fund</th>
                    <th>Rapportdato</th>
                    <th>Se rapport</th>
                  </tr>
                </thead>
                <tbody>
                  {synlige.map((r) => {
                    const cfg = FUND_CFG[r.fundNiveau] ?? FUND_CFG.ukendt;
                    return (
                      <tr key={r.id}>
                        <td className="table-cell-bold">{r.navn}</td>
                        <td className="table-cell-muted">
                          {r.kommune?.replace(' Kommune', '') ?? '—'}
                        </td>
                        <td>
                          {r.paragraf
                            ? <span className="badge badge-neutral">{r.paragraf}</span>
                            : <span className="table-cell-muted">—</span>
                          }
                        </td>
                        <td>
                          {r.losmedlem
                            ? <span className="badge badge-los">Ja</span>
                            : <span className="table-cell-muted">—</span>
                          }
                        </td>
                        <td>
                          {r.harStpsRapport
                            ? <span className="badge badge-stps">Ja</span>
                            : <span className="table-cell-muted">—</span>
                          }
                        </td>
                        <td>
                          <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                        </td>
                        <td className="table-cell-muted" style={{ whiteSpace: 'nowrap' }}>
                          {formatDato(r.rapportDato)}
                        </td>
                        <td>
                          {r.rapportLink && !r.rapportLink.startsWith('stps://genereret/') ? (
                            <a
                              href={r.rapportLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="knap-link"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                                fontSize: 'var(--text-xs)', color: 'var(--color-text)', textDecoration: 'none',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Se rapport <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="table-cell-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {antalSider > 1 && (
            <div className="rl-pagination">
              <button
                className="rl-page-knap"
                onClick={() => setSide((s) => Math.max(1, s - 1))}
                disabled={sidenummer === 1}
              >
                <ChevronLeft size={15} />
              </button>
              <div className="rl-page-numre">
                {Array.from({ length: antalSider }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === antalSider || Math.abs(n - sidenummer) <= 2)
                  .reduce<(number | '…')[]>((acc, n, i, arr) => {
                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === '…' ? (
                      <span key={`ellipsis-${i}`} className="rl-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setSide(n as number)}
                        className={`rl-page-num ${sidenummer === n ? 'rl-page-num--aktiv' : ''}`}
                      >
                        {n}
                      </button>
                    )
                  )}
              </div>
              <button
                className="rl-page-knap"
                onClick={() => setSide((s) => Math.min(antalSider, s + 1))}
                disabled={sidenummer === antalSider}
              >
                <ChevronRight size={15} />
              </button>
              <span className="rl-page-info">
                {(sidenummer - 1) * PR_SIDE + 1}–{Math.min(sidenummer * PR_SIDE, filtrerede.length)} af {filtrerede.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Højre: Filter-panel ────────────────────────── */}
      {filterPanelaaben && (
        <div style={{
          width: '240px', flexShrink: 0,
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface)', padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-sm)' }}>Filtre</span>
            <button
              onClick={() => setFilterPanelaaben(false)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}
              aria-label="Luk filterpanel"
            >
              <X size={15} />
            </button>
          </div>

          {/* Bosted-gruppe */}
          <FilterGruppe titel="Bosted">
            {kommuner.slice(0, 10).map((k) => (
              <FilterKnap
                key={k}
                label={k.replace(' Kommune', '')}
                aktiv={harAktivFilter('kommune', k)}
                onClick={() => harAktivFilter('kommune', k)
                  ? fjernFilter('kommune', k)
                  : tilfoejFilter({ type: 'kommune', vaerdi: k, label: k.replace(' Kommune', '') })}
              />
            ))}
          </FilterGruppe>

          {/* Rapport-gruppe */}
          <FilterGruppe titel="Rapport">
            {(['kritisk', 'stoerre', 'mindre', 'ingen'] as FundNiveau[]).map((f) => (
              <FilterKnap
                key={f}
                label={FUND_CFG[f].label}
                aktiv={harAktivFilter('fund', f)}
                onClick={() => harAktivFilter('fund', f)
                  ? fjernFilter('fund', f)
                  : tilfoejFilter({ type: 'fund', vaerdi: f, label: FUND_CFG[f].label })}
              />
            ))}
          </FilterGruppe>

          {/* Andre-gruppe */}
          <FilterGruppe titel="Andre">
            {(['§107', '§108', '§85'] as string[]).map((p) => (
              <FilterKnap
                key={p}
                label={p}
                aktiv={harAktivFilter('paragraf', p)}
                onClick={() => harAktivFilter('paragraf', p)
                  ? fjernFilter('paragraf', p)
                  : tilfoejFilter({ type: 'paragraf', vaerdi: p, label: p })}
              />
            ))}
            <FilterKnap
              label="LOS-medlem"
              aktiv={harAktivFilter('los', 'ja')}
              onClick={() => harAktivFilter('los', 'ja')
                ? fjernFilter('los', 'ja')
                : tilfoejFilter({ type: 'los', vaerdi: 'ja', label: 'LOS-medlem' })}
            />
            <FilterKnap
              label="Har STPS-rapport"
              aktiv={harAktivFilter('stps', 'ja')}
              onClick={() => harAktivFilter('stps', 'ja')
                ? fjernFilter('stps', 'ja')
                : tilfoejFilter({ type: 'stps', vaerdi: 'ja', label: 'Har STPS-rapport' })}
            />
          </FilterGruppe>

          {aktiveFiltre.length > 0 && (
            <button
              onClick={nulstilFiltre}
              style={{
                padding: '0.4rem', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)', background: 'transparent',
                fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              Nulstil alle filtre
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterGruppe({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'var(--fw-semibold)' }}>
        {titel}
      </span>
      {children}
    </div>
  );
}

function FilterKnap({ label, aktiv, onClick }: { label: string; aktiv: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)',
        border: aktiv ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
        background: aktiv ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent',
        color: aktiv ? 'var(--color-primary)' : 'var(--color-text)',
        fontSize: 'var(--text-xs)', cursor: 'pointer', textAlign: 'left', width: '100%',
      }}
    >
      <span style={{
        width: '12px', height: '12px', borderRadius: '3px', flexShrink: 0,
        border: aktiv ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
        background: aktiv ? 'var(--color-primary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {aktiv && <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '1px' }} />}
      </span>
      {label}
    </button>
  );
}
