// src/features/dashboard/components/DatoVælger/DatoVælger.tsx

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown, X } from 'lucide-react';

export type DatoPeriode = {
  fra: string; // ISO date YYYY-MM-DD
  til: string;
  label: string;
};

export const PRESETS: DatoPeriode[] = [
  { label: 'Seneste 30 dage',    fra: dageRetur(30),  til: idag() },
  { label: 'Seneste 3 måneder',  fra: dageRetur(90),  til: idag() },
  { label: 'Seneste 6 måneder',  fra: dageRetur(180), til: idag() },
  { label: 'Seneste år',         fra: dageRetur(365), til: idag() },
  { label: 'Alle tid',           fra: '2000-01-01',   til: idag() },
];

export const DEFAULT_PRESET = PRESETS[3]; // Seneste år

function idag(): string {
  return new Date().toISOString().slice(0, 10);
}

function dageRetur(dage: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dage);
  return d.toISOString().slice(0, 10);
}

function findPresetLabel(fra: string | null, til: string | null): string {
  if (!fra || !til) return DEFAULT_PRESET.label;
  const match = PRESETS.find((p) => p.fra === fra && p.til === til);
  return match?.label ?? `${fra} → ${til}`;
}

type Props = {
  variant?: 'desktop' | 'mobil';
  onLuk?: () => void;
};

export function DatoVælger({ variant = 'desktop', onLuk }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [åben, setÅben] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fra = params.get('fra');
  const til = params.get('til');
  const aktivLabel = findPresetLabel(fra, til);

  const vælgPreset = useCallback((preset: DatoPeriode) => {
    try { localStorage.setItem('keascare-dato-fra', preset.fra); } catch {}
    try { localStorage.setItem('keascare-dato-til', preset.til); } catch {}
    const sp = new URLSearchParams(params.toString());
    sp.set('fra', preset.fra);
    sp.set('til', preset.til);
    router.replace(`?${sp.toString()}`, { scroll: false });
    setÅben(false);
    onLuk?.();
  }, [params, router, onLuk]);

  useEffect(() => {
    if (!fra || !til) {
      const gemt = {
        fra: (() => { try { return localStorage.getItem('keascare-dato-fra'); } catch { return null; } })(),
        til: (() => { try { return localStorage.getItem('keascare-dato-til'); } catch { return null; } })(),
      };
      const valgtFra = gemt.fra ?? DEFAULT_PRESET.fra;
      const valgtTil = gemt.til ?? DEFAULT_PRESET.til;
      const sp = new URLSearchParams(params.toString());
      sp.set('fra', valgtFra);
      sp.set('til', valgtTil);
      router.replace(`?${sp.toString()}`, { scroll: false });
    }
  }, [fra, til, params, router]);

  useEffect(() => {
    if (!åben) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setÅben(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [åben]);

  if (variant === 'mobil') {
    return (
      <div className="datovælger-mobil">
        <p className="datovælger-mobil-titel">Vælg periode</p>
        <div className="datovælger-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              className={`datovælger-preset-knap${aktivLabel === preset.label ? ' aktiv' : ''}`}
              onClick={() => vælgPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="datovælger-wrap">
      <button
        className={`datovælger-knap${åben ? ' åben' : ''}`}
        onClick={() => setÅben((v) => !v)}
        aria-label="Vælg periode"
      >
        <Calendar size={14} className="datovælger-ikon" />
        <span className="datovælger-label">{aktivLabel}</span>
        <ChevronDown size={13} className={`datovælger-pil${åben ? ' roteret' : ''}`} />
      </button>

      {åben && (
        <div className="datovælger-dropdown">
          <div className="datovælger-dropdown-header">
            <span className="datovælger-dropdown-titel">Periode</span>
            <button className="datovælger-luk" onClick={() => setÅben(false)}>
              <X size={13} />
            </button>
          </div>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              className={`datovælger-option${aktivLabel === preset.label ? ' aktiv' : ''}`}
              onClick={() => vælgPreset(preset)}
            >
              {preset.label}
              {aktivLabel === preset.label && <span className="datovælger-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
