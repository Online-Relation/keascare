'use client';
// src/features/rapporter/components/RapporterPage/RapporterListeSektion/RapporterListeSektion.tsx

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, CheckCircle, HelpCircle, ExternalLink, Search, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import type { RapportRække, FundNiveau } from '@/features/rapporter/types/rapporter.types';

type FilterValg = 'alle' | FundNiveau;

const PR_SIDE = 20;

const FUND_CFG: Record<FundNiveau, { label: string; kortLabel: string; cls: string; Ikon: React.ElementType }> = {
  kritisk: { label: 'Kritiske fund',  kortLabel: 'Kritisk',  cls: 'badge-kritisk', Ikon: AlertTriangle },
  stoerre: { label: 'Større fund',    kortLabel: 'Større',   cls: 'badge-stoerre', Ikon: AlertCircle },
  mindre:  { label: 'Mindre fund',    kortLabel: 'Mindre',   cls: 'badge-mindre',  Ikon: AlertCircle },
  ingen:   { label: 'Ingen fund',     kortLabel: 'Ingen',    cls: 'badge-ingen',   Ikon: CheckCircle },
  ukendt:  { label: 'Ukendt',         kortLabel: 'Ukendt',   cls: 'badge-ukendt',  Ikon: HelpCircle },
};

const FILTER_RÆKKEFØLGE: FilterValg[] = ['alle', 'kritisk', 'stoerre', 'mindre', 'ingen'];

type Props = { rapporter: RapportRække[] };

export function RapporterListeSektion({ rapporter }: Props) {
  const [filter, setFilter] = useState<FilterValg>('kritisk');
  const [søgning, setSøgning] = useState('');
  const [side, setSide] = useState(1);

  const filtrerede = useMemo(() => {
    let liste = rapporter;
    if (filter !== 'alle') liste = liste.filter((r) => r.fundNiveau === filter);
    if (søgning.trim()) {
      const s = søgning.toLowerCase();
      liste = liste.filter(
        (r) => r.navn.toLowerCase().includes(s) || (r.kommune ?? '').toLowerCase().includes(s)
      );
    }
    return liste;
  }, [rapporter, filter, søgning]);

  const antalSider = Math.max(1, Math.ceil(filtrerede.length / PR_SIDE));
  const sidenummer = Math.min(side, antalSider);
  const synlige = filtrerede.slice((sidenummer - 1) * PR_SIDE, sidenummer * PR_SIDE);

  function skiftFilter(nyt: FilterValg) {
    setFilter(nyt);
    setSide(1);
    setSøgning('');
  }

  function tæl(f: FilterValg) {
    if (f === 'alle') return rapporter.length;
    return rapporter.filter((r) => r.fundNiveau === f).length;
  }

  const harKritiske = filter === 'alle' || filter === 'kritisk' || filter === 'stoerre';

  return (
    <div className="rl-wrapper">

      {/* ── Fokus-banner ───────────────────────────────── */}
      {(filter === 'kritisk' || filter === 'stoerre' || filter === 'alle') && (
        <div className="rl-fokus-banner">
          <div className="rl-fokus-banner-venstre">
            <Flame size={18} className="rl-fokus-ikon" />
            <div>
              <p className="rl-fokus-titel">Salgsfokus</p>
              <p className="rl-fokus-beskrivelse">
                {tæl('kritisk') + tæl('stoerre')} bosteder med kritiske eller større fund —
                disse er de primære salgsmuligheder for KeasCare
              </p>
            </div>
          </div>
          <div className="rl-fokus-tal-gruppe">
            <div className="rl-fokus-tal rl-fokus-tal-kritisk">
              <span>{tæl('kritisk')}</span>
              <span>Kritiske</span>
            </div>
            <div className="rl-fokus-tal rl-fokus-tal-stoerre">
              <span>{tæl('stoerre')}</span>
              <span>Større</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter + søgning ───────────────────────────── */}
      <div className="rl-kontroller">
        <div className="rl-filter-chips">
          {FILTER_RÆKKEFØLGE.map((f) => (
            <button
              key={f}
              onClick={() => skiftFilter(f)}
              className={`rl-chip ${filter === f ? 'rl-chip--aktiv' : ''} ${f !== 'alle' ? `rl-chip--${f}` : ''}`}
            >
              {f === 'alle' ? 'Alle' : FUND_CFG[f as FundNiveau].kortLabel}
              <span className="rl-chip-tal">{tæl(f)}</span>
            </button>
          ))}
        </div>
        <div className="rl-søgning-wrapper">
          <Search size={14} className="rl-søgning-ikon" />
          <input
            className="rl-søgning-input"
            type="text"
            placeholder="Søg bosted eller kommune…"
            value={søgning}
            onChange={(e) => { setSøgning(e.target.value); setSide(1); }}
          />
        </div>
      </div>

      {/* ── Tabel ─────────────────────────────────────── */}
      <div className="dashboard-table-wrapper">
        <div className="dashboard-section-header">
          <span className="dashboard-section-title">
            {filter === 'alle' ? 'Alle rapporter' : `${FUND_CFG[filter as FundNiveau]?.label ?? filter}`}
          </span>
          <span className="rap-tabel-antal">
            {filtrerede.length} {filtrerede.length === 1 ? 'rapport' : 'rapporter'}
          </span>
        </div>

        {filtrerede.length === 0 ? (
          <div className="rl-ingen">
            <Search size={20} />
            <span>Ingen rapporter matcher søgningen</span>
          </div>
        ) : (
          <div className="rap-tabel-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bosted</th>
                  <th>Kommune</th>
                  <th>Fund</th>
                  <th>Rapportdato</th>
                  <th>Fokusområder</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {synlige.map((r) => {
                  const cfg = FUND_CFG[r.fundNiveau] ?? FUND_CFG.ukendt;
                  const Ikon = cfg.Ikon;
                  const erKritisk = r.fundNiveau === 'kritisk';
                  const erStoerre = r.fundNiveau === 'stoerre';
                  return (
                    <tr
                      key={r.id}
                      className={erKritisk ? 'rap-kritisk-række' : erStoerre ? 'rap-stoerre-række' : ''}
                    >
                      <td>
                        <Link href={`/dashboard/bosteder/${r.id}`} className="rap-bosted-link">
                          {r.navn}
                        </Link>
                      </td>
                      <td className="table-cell-muted">
                        {r.kommune?.replace(' Kommune', '') ?? '—'}
                      </td>
                      <td>
                        <span className={`badge ${cfg.cls}`}>
                          <Ikon size={10} style={{ marginRight: '0.25rem', flexShrink: 0 }} />
                          {cfg.kortLabel}
                        </span>
                      </td>
                      <td className="table-cell-muted" style={{ whiteSpace: 'nowrap' }}>
                        {r.rapportDato
                          ? new Date(r.rapportDato).toLocaleDateString('da-DK', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="table-cell-muted rap-tema-celle">
                        {r.temaer.slice(0, 2).join(', ') || '—'}
                      </td>
                      <td>
                        {r.rapportLink && (
                          <a
                            href={r.rapportLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rap-pdf-link"
                            title="Åbn rapport (PDF)"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────── */}
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
  );
}
