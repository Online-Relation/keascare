'use client';

// src/features/dashboard/components/GlobalSearch/GlobalSearch.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import type { BostedSøgeresultat } from '@/app/api/search/bosteder/route';

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

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [resultater, setResultater] = useState<BostedSøgeresultat[]>([]);
  const [fokus, setFokus] = useState(false);
  const [aktivIndex, setAktivIndex] = useState(-1);
  const [indlæser, setIndlæser] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const åben = fokus && (query.length >= 2 || resultater.length > 0);

  const søg = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResultater([]);
      return;
    }
    setIndlæser(true);
    try {
      const res = await fetch(`/api/search/bosteder?q=${encodeURIComponent(q)}`);
      const data: BostedSøgeresultat[] = await res.json();
      setResultater(data);
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

  // ⌘K / Ctrl+K genvej
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

  function vælg(resultat: BostedSøgeresultat) {
    router.push(`/dashboard/bosteder/${resultat.id}`);
    setQuery('');
    setResultater([]);
    setFokus(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!åben) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAktivIndex((i) => Math.min(i + 1, resultater.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAktivIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && aktivIndex >= 0) {
      e.preventDefault();
      vælg(resultater[aktivIndex]);
    } else if (e.key === 'Escape') {
      setFokus(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className={`gs-wrap${fokus ? ' gs-fokus' : ''}`} ref={containerRef}>
      <div className="gs-felt">
        <Search className="gs-ikon" size={16} />
        <input
          ref={inputRef}
          className="gs-input"
          type="text"
          placeholder="Søg efter bosted..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFokus(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {!fokus && (
          <kbd className="gs-genvej">
            <span>⌘</span>K
          </kbd>
        )}
        {fokus && query && (
          <button
            className="gs-ryd"
            onMouseDown={(e) => { e.preventDefault(); setQuery(''); setResultater([]); }}
            aria-label="Ryd"
          >
            ✕
          </button>
        )}
      </div>

      {åben && (
        <div className="gs-dropdown">
          {indlæser ? (
            <div className="gs-status">
              <span className="gs-spinner" />
              Søger...
            </div>
          ) : resultater.length === 0 && query.length >= 2 ? (
            <div className="gs-status gs-ingen">
              <Search size={20} opacity={0.3} />
              Ingen bosteder matcher &quot;{query}&quot;
            </div>
          ) : (
            <>
              <div className="gs-label">Bosteder</div>
              <ul className="gs-liste" role="listbox">
                {resultater.map((r, i) => (
                  <li
                    key={r.id}
                    className={`gs-item${i === aktivIndex ? ' gs-aktiv' : ''}`}
                    role="option"
                    aria-selected={i === aktivIndex}
                    onMouseDown={() => vælg(r)}
                    onMouseEnter={() => setAktivIndex(i)}
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
                ))}
              </ul>
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
