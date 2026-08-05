'use client';
// src/features/rapporter/components/RapporterPage/RapporterListeSektion/RapporterListeSektion.tsx

import { useState, useMemo } from 'react';
import { Search, Plus, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RapportRække } from '@/features/rapporter/types/rapporter.types';
import { FilterPanel } from './FilterPanel';
import type { FilterState, SortValg, SubPanel } from './types';
import { TOMT_FILTER, FUND_CFG } from './types';

const PR_SIDE = 25;

type Chip = { felt: keyof FilterState; label: string; vaerdierLabel: string };

function aktiveChips(filtre: FilterState): Chip[] {
  const liste: Chip[] = [];
  if (filtre.kommuner.length)    liste.push({ felt: 'kommuner',    label: 'Kommune',      vaerdierLabel: filtre.kommuner.map((k) => k.replace(' Kommune', '')).join(', ') });
  if (filtre.paragraffer.length) liste.push({ felt: 'paragraffer', label: 'Paragraf',     vaerdierLabel: filtre.paragraffer.join(', ') });
  if (filtre.los.length)         liste.push({ felt: 'los',         label: 'LOS-medlem',   vaerdierLabel: filtre.los.map((v) => v === 'ja' ? 'Ja' : 'Nej').join(', ') });
  if (filtre.stpsRapport.length) liste.push({ felt: 'stpsRapport', label: 'STPS-rapport', vaerdierLabel: filtre.stpsRapport.map((v) => v === 'ja' ? 'Ja' : 'Nej').join(', ') });
  if (filtre.stpsFund.length)    liste.push({ felt: 'stpsFund',    label: 'STPS-fund',    vaerdierLabel: filtre.stpsFund.map((v) => FUND_CFG[v]?.kortLabel ?? v).join(', ') });
  return liste;
}

type Props = { rapporter: RapportRække[] };

export function RapporterListeSektion({ rapporter }: Props) {
  const [søgning, setSøgning] = useState('');
  const [sortering, setSortering] = useState<SortValg>('nyeste');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [subPanel, setSubPanel] = useState<SubPanel>(null);
  const [filterSøgning, setFilterSøgning] = useState('');
  const [filtre, setFiltre] = useState<FilterState>(TOMT_FILTER);
  const [kladde, setKladde] = useState<FilterState>(TOMT_FILTER);
  const [side, setSide] = useState(1);

  const kommuner = useMemo(() => {
    const unikke = [...new Set(rapporter.map((r) => r.kommune).filter(Boolean) as string[])];
    return unikke.sort();
  }, [rapporter]);

  function åbnPanel() {
    setKladde({ ...filtre });
    setFilterPanelOpen(true);
    setSubPanel(null);
    setFilterSøgning('');
  }

  function lukkPanel() {
    setFilterPanelOpen(false);
    setSubPanel(null);
  }

  function anvendFiltre() {
    setFiltre({ ...kladde });
    setSide(1);
    lukkPanel();
  }

  function nulstil() {
    setFiltre(TOMT_FILTER);
    setKladde(TOMT_FILTER);
    setSide(1);
  }

  function toggleKladde(felt: keyof FilterState, vaerdi: string) {
    setKladde((prev) => {
      const arr = prev[felt] as string[];
      return { ...prev, [felt]: arr.includes(vaerdi) ? arr.filter((v) => v !== vaerdi) : [...arr, vaerdi] };
    });
  }

  function fjernFilter(felt: keyof FilterState) {
    setFiltre((prev) => ({ ...prev, [felt]: [] }));
    setSide(1);
  }

  const chips = aktiveChips(filtre);
  const harFiltre = chips.length > 0;

  const filtrerede = useMemo(() => {
    let liste = rapporter;
    if (søgning.trim()) {
      const s = søgning.toLowerCase();
      liste = liste.filter((r) => r.navn.toLowerCase().includes(s) || (r.kommune ?? '').toLowerCase().includes(s));
    }
    if (filtre.kommuner.length)    liste = liste.filter((r) => r.kommune && filtre.kommuner.includes(r.kommune));
    if (filtre.paragraffer.length) liste = liste.filter((r) => r.paragraf && filtre.paragraffer.includes(r.paragraf));
    if (filtre.los.length)         liste = liste.filter((r) => filtre.los.includes(r.losmedlem ? 'ja' : 'nej'));
    if (filtre.stpsRapport.length) liste = liste.filter((r) => filtre.stpsRapport.includes(r.harStpsRapport ? 'ja' : 'nej'));
    if (filtre.stpsFund.length)    liste = liste.filter((r) => filtre.stpsFund.includes(r.fundNiveau));

    return [...liste].sort((a, b) => {
      if (sortering === 'nyeste')  return (b.rapportDato ?? '').localeCompare(a.rapportDato ?? '');
      if (sortering === 'aeldste') return (a.rapportDato ?? '').localeCompare(b.rapportDato ?? '');
      if (sortering === 'navn')    return a.navn.localeCompare(b.navn, 'da');
      if (sortering === 'fund') {
        const o = ['kritisk', 'stoerre', 'mindre', 'ingen', 'ukendt'];
        return o.indexOf(a.fundNiveau) - o.indexOf(b.fundNiveau);
      }
      return 0;
    });
  }, [rapporter, søgning, filtre, sortering]);

  const antalSider = Math.max(1, Math.ceil(filtrerede.length / PR_SIDE));
  const sidenummer = Math.min(side, antalSider);
  const synlige = filtrerede.slice((sidenummer - 1) * PR_SIDE, sidenummer * PR_SIDE);

  function formatDato(dato: string | null) {
    if (!dato) return '—';
    return new Date(dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Søgebar */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Søg efter bosted, kommune eller rapport..."
            value={søgning}
            onChange={(e) => { setSøgning(e.target.value); setSide(1); }}
            style={{
              width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.25rem',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)', fontSize: 'var(--text-sm)',
              color: 'var(--color-text)', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tilføj filter + Nulstil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={åbnPanel}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)', color: '#fff', border: 'none',
              fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            Tilføj filter
          </button>
          {harFiltre && (
            <button
              onClick={nulstil}
              style={{
                padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', background: 'transparent',
                fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', cursor: 'pointer',
              }}
            >
              Nulstil
            </button>
          )}
        </div>

        {/* Aktive filter-chips */}
        {harFiltre && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {chips.map((chip) => (
              <div
                key={chip.felt}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{chip.label}</span>
                <span style={{ fontWeight: 'var(--fw-medium)', color: 'var(--color-text)' }}>{chip.vaerdierLabel}</span>
                <button
                  onClick={() => fjernFilter(chip.felt)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resultater + sortering */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 'var(--fw-medium)' }}>
            {filtrerede.length} rapporter matcher
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Sortér:</span>
            <select
              value={sortering}
              onChange={(e) => { setSortering(e.target.value as SortValg); setSide(1); }}
              style={{
                padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                fontSize: 'var(--text-sm)', color: 'var(--color-text)', cursor: 'pointer',
              }}
            >
              <option value="nyeste">Nyeste først</option>
              <option value="aeldste">Ældste først</option>
              <option value="navn">Bostedsnavn A-Z</option>
              <option value="fund">Fund (alvorligste)</option>
            </select>
          </div>
        </div>

        {/* Tabel */}
        <div className="dashboard-table-wrapper" style={{ margin: 0 }}>
          {filtrerede.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={20} />
              <span>Ingen rapporter matcher</span>
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
                    const harLink = r.rapportLink && !r.rapportLink.startsWith('stps://genereret/');
                    return (
                      <tr key={r.id}>
                        <td className="table-cell-bold">{r.navn}</td>
                        <td className="table-cell-muted">{r.kommune?.replace(' Kommune', '') ?? '—'}</td>
                        <td>{r.paragraf ? <span className="badge badge-neutral">{r.paragraf}</span> : <span className="table-cell-muted">—</span>}</td>
                        <td>{r.losmedlem ? <span className="badge badge-los">Ja</span> : <span className="table-cell-muted">—</span>}</td>
                        <td>{r.harStpsRapport ? <span className="badge badge-stps">Ja</span> : <span className="table-cell-muted">—</span>}</td>
                        <td><span className={`badge ${cfg.cls}`}>{cfg.kortLabel}</span></td>
                        <td className="table-cell-muted" style={{ whiteSpace: 'nowrap' }}>{formatDato(r.rapportDato)}</td>
                        <td>
                          {harLink ? (
                            <a href={r.rapportLink!} target="_blank" rel="noopener noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                              fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>
                              <Eye size={12} /> Se rapport
                            </a>
                          ) : <span className="table-cell-muted">—</span>}
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
              <button className="rl-page-knap" onClick={() => setSide((s) => Math.max(1, s - 1))} disabled={sidenummer === 1}><ChevronLeft size={15} /></button>
              <div className="rl-page-numre">
                {Array.from({ length: antalSider }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === antalSider || Math.abs(n - sidenummer) <= 2)
                  .reduce<(number | '…')[]>((acc, n, i, arr) => {
                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(n); return acc;
                  }, [])
                  .map((n, i) => n === '…'
                    ? <span key={`e-${i}`} className="rl-page-ellipsis">…</span>
                    : <button key={n} onClick={() => setSide(n as number)} className={`rl-page-num ${sidenummer === n ? 'rl-page-num--aktiv' : ''}`}>{n}</button>
                  )}
              </div>
              <button className="rl-page-knap" onClick={() => setSide((s) => Math.min(antalSider, s + 1))} disabled={sidenummer === antalSider}><ChevronRight size={15} /></button>
              <span className="rl-page-info">{(sidenummer - 1) * PR_SIDE + 1}–{Math.min(sidenummer * PR_SIDE, filtrerede.length)} af {filtrerede.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter panel overlay */}
      {filterPanelOpen && (
        <FilterPanel
          kladde={kladde}
          kommuner={kommuner}
          subPanel={subPanel}
          filterSøgning={filterSøgning}
          onFilterSøgning={setFilterSøgning}
          onSubPanel={setSubPanel}
          onToggle={toggleKladde}
          onFjern={fjernFilter}
          onAnvend={anvendFiltre}
          onLuk={lukkPanel}
        />
      )}
    </>
  );
}
