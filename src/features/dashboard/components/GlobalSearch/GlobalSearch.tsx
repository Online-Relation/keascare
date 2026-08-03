'use client';

// src/features/dashboard/components/GlobalSearch/GlobalSearch.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import type { BostedSøgeresultat } from '@/app/api/search/bosteder/route';
import type { InspektoerSøgeresultat } from '@/app/api/search/inspektoerer/route';
import type { KommuneSøgeresultat } from '@/app/api/search/kommuner/route';

const FUND_KLASSE: Record<string, string> = {
  kritisk: 'badge-kritisk',
  større: 'badge-større',
  mindre: 'badge-mindre',
  ingen: 'badge-ingen',
};

const FUND_LABEL: Record<string, string> = {
  kritisk: 'Kritisk',
  større: 'Større fund',
  mindre: 'Mindre fund',
  ingen: 'Ingen fund',
};

type Søgeresultater = {
  bosteder: BostedSøgeresultat[];
  inspektoerer: InspektoerSøgeresultat[];
  kommuner: KommuneSøgeresultat[];
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [resultater, setResultater] = useState<Søgeresultater>({ bosteder: [], inspektoerer: [], kommuner: [] });
  const [fokus, setFokus] = useState(false);
  const [aktivIndex, setAktivIndex] = useState(-1);
  const [indlæser, setIndlæser] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const alleResultater = [
    ...resultater.bosteder.map((r) => ({ type: 'bosted' as const, ...r })),
    ...resultater.inspektoerer.map((r) => ({ type: 'inspektoer' as const, ...r })),
    ...resultater.kommuner.map((r) => ({ type: 'kommune' as const, ...r })),
  ];
  const harResultater = alleResultater.length > 0;
  const åben = fokus && (query.length >= 2 || harResultater);

  const søg = useCallback(async (q: string) => {
    if (q.length < 2) { setResultater({ bosteder: [], inspektoerer: [], kommuner: [] }); return; }
    setIndlæser(true);
    try {
      const [bRes, iRes, kRes] = await Promise.all([
        fetch(`/api/search/bosteder?q=${encodeURIComponent(q)}`),
        fetch(`/api/search/inspektoerer?q=${encodeURIComponent(q)}`),
        fetch(`/api/search/kommuner?q=${encodeURIComponent(q)}`),
      ]);
      const [bosteder, inspektoerer, kommuner] = await Promise.all([bRes.json(), iRes.json(), kRes.json()]);
      setResultater({ bosteder, inspektoerer, kommuner });
      setAktivIndex(-1);
    } finally {
      setIndlæser(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => søg(query), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, søg]);

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFokus(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function vælgBosted(r: BostedSøgeresultat) { router.push(`/dashboard/bosteder/${r.id}`); luk(); }
  function vælgInspektoer(r: InspektoerSøgeresultat) { router.push(`/dashboard/rapporter/inspektoerer/${r.slug}`); luk(); }
  function vælgKommune(r: KommuneSøgeresultat) { router.push(`/dashboard/kommuner/${r.slug}`); luk(); }

  function luk() {
    setQuery('');
    setResultater({ bosteder: [], inspektoerer: [], kommuner: [] });
    setFokus(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!åben) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAktivIndex((i) => Math.min(i + 1, alleResultater.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAktivIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && aktivIndex >= 0) {
      e.preventDefault();
      const valgt = alleResultater[aktivIndex];
      if (valgt.type === 'bosted') vælgBosted(valgt as BostedSøgeresultat);
      else if (valgt.type === 'inspektoer') vælgInspektoer(valgt as InspektoerSøgeresultat);
      else vælgKommune(valgt as KommuneSøgeresultat);
    } else if (e.key === 'Escape') {
      setFokus(false);
      inputRef.current?.blur();
    }
  }

  // Index offsets for keyboard nav
  const bostedOffset = 0;
  const inspektoerOffset = resultater.bosteder.length;
  const kommuneOffset = inspektoerOffset + resultater.inspektoerer.length;

  return (
    <div className={`gs-wrap${fokus ? ' gs-fokus' : ''}`} ref={containerRef}>
      <div className="gs-felt">
        <Search className="gs-ikon" size={16} />
        <input
          ref={inputRef}
          className="gs-input"
          type="text"
          placeholder="Søg efter bosted, inspektør eller kommune..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFokus(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {!fokus && <kbd className="gs-genvej"><span>⌘</span>K</kbd>}
        {fokus && query && (
          <button className="gs-ryd" onMouseDown={(e) => { e.preventDefault(); setQuery(''); setResultater({ bosteder: [], inspektoerer: [], kommuner: [] }); }} aria-label="Ryd">✕</button>
        )}
      </div>

      {åben && (
        <div className="gs-dropdown">
          {indlæser ? (
            <div className="gs-status"><span className="gs-spinner" />Søger...</div>
          ) : !harResultater && query.length >= 2 ? (
            <div className="gs-status gs-ingen">
              <Search size={20} opacity={0.3} />
              Ingen resultater for &quot;{query}&quot;
            </div>
          ) : (
            <>
              {resultater.bosteder.length > 0 && (
                <>
                  <div className="gs-label">Bosteder</div>
                  <ul className="gs-liste" role="listbox">
                    {resultater.bosteder.map((r, i) => {
                      const idx = bostedOffset + i;
                      return (
                        <li
                          key={r.id}
                          className={`gs-item${idx === aktivIndex ? ' gs-aktiv' : ''}`}
                          role="option"
                          aria-selected={idx === aktivIndex}
                          onMouseDown={() => vælgBosted(r)}
                          onMouseEnter={() => setAktivIndex(idx)}
                        >
                          <span className="gs-item-ikon">🏠</span>
                          <span className="gs-item-tekst">
                            <span className="gs-item-navn">{r.navn}</span>
                            <span className="gs-item-meta">
                              {r.kommune && <span>{r.kommune}</span>}
                              {r.region && <span>{r.region}</span>}
                            </span>
                          </span>
                          {r.fundNiveau && (
                            <span className={`badge ${FUND_KLASSE[r.fundNiveau] ?? 'badge-ukendt'}`}>
                              {FUND_LABEL[r.fundNiveau] ?? r.fundNiveau}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {resultater.inspektoerer.length > 0 && (
                <>
                  <div className="gs-label">Inspektører</div>
                  <ul className="gs-liste" role="listbox">
                    {resultater.inspektoerer.map((r, i) => {
                      const idx = inspektoerOffset + i;
                      return (
                        <li
                          key={r.slug}
                          className={`gs-item${idx === aktivIndex ? ' gs-aktiv' : ''}`}
                          role="option"
                          aria-selected={idx === aktivIndex}
                          onMouseDown={() => vælgInspektoer(r)}
                          onMouseEnter={() => setAktivIndex(idx)}
                        >
                          <span className="gs-item-ikon">🔍</span>
                          <span className="gs-item-tekst">
                            <span className="gs-item-navn">{r.navn}</span>
                            <span className="gs-item-meta">
                              <span>{r.antal} tilsyn</span>
                            </span>
                          </span>
                          {r.titel && (
                            <span className="badge badge-ukendt" style={{ fontStyle: 'normal', textTransform: 'none', letterSpacing: 0 }}>
                              {r.titel}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {resultater.kommuner.length > 0 && (
                <>
                  <div className="gs-label">Kommuner</div>
                  <ul className="gs-liste" role="listbox">
                    {resultater.kommuner.map((r, i) => {
                      const idx = kommuneOffset + i;
                      return (
                        <li
                          key={r.slug}
                          className={`gs-item${idx === aktivIndex ? ' gs-aktiv' : ''}`}
                          role="option"
                          aria-selected={idx === aktivIndex}
                          onMouseDown={() => vælgKommune(r)}
                          onMouseEnter={() => setAktivIndex(idx)}
                        >
                          <span className="gs-item-ikon"><MapPin size={14} /></span>
                          <span className="gs-item-tekst">
                            <span className="gs-item-navn">{r.navn.replace(/\s+[Kk]ommune$/, '')} Kommune</span>
                          </span>
                          <span className="badge badge-ukendt" style={{ fontStyle: 'normal', textTransform: 'none', letterSpacing: 0 }}>
                            Kommune
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <div className="gs-footer">
                <span><kbd>↑↓</kbd> naviger</span>
                <span><kbd>↵</kbd> åbn</span>
                <span><kbd>esc</kbd> luk</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
