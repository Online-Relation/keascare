// src/features/dashboard/components/DatoVælger/DatoVælger.tsx

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown, X } from 'lucide-react';

export type DatoPeriode = {
  fra: string; // ISO date YYYY-MM-DD
  til: string;
  label: string;
  fastTil?: boolean; // true = opdater IKKE til-dato til idag ved reload (fx "Sidste år")
};

// Funktioner beregner datoen ved kørselstidspunkt — ikke ved build-tidspunkt
function idag(): string {
  return new Date().toISOString().slice(0, 10);
}

function dageRetur(dage: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dage);
  return d.toISOString().slice(0, 10);
}

function åretsFørste(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function sidsteÅrFra(): string {
  return `${new Date().getFullYear() - 1}-01-01`;
}

function sidsteÅrTil(): string {
  return `${new Date().getFullYear() - 1}-12-31`;
}

export function getPresets(): DatoPeriode[] {
  return [
    { label: 'Seneste 30 dage',   fra: dageRetur(30),  til: idag() },
    { label: 'Seneste 3 måneder', fra: dageRetur(90),  til: idag() },
    { label: 'Seneste 6 måneder', fra: dageRetur(180), til: idag() },
    { label: 'I år',              fra: åretsFørste(),  til: idag() },
    { label: 'Sidste år',         fra: sidsteÅrFra(),  til: sidsteÅrTil(), fastTil: true },
    { label: 'Maximum',           fra: '2000-01-01',   til: idag() },
  ];
}

export const DEFAULT_PRESET_LABEL = 'I år';

function findPreset(fra: string | null): DatoPeriode | undefined {
  if (!fra) return undefined;
  return getPresets().find((p) => p.fra === fra);
}

function findPresetLabel(fra: string | null, til: string | null): string {
  if (!fra || !til) return DEFAULT_PRESET_LABEL;
  const match = findPreset(fra);
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

  const fraParam = params.get('fra');
  const aktivLabel = findPresetLabel(fraParam, params.get('til'));

  const vælgPreset = useCallback((preset: DatoPeriode) => {
    try { localStorage.setItem('keascare-dato-preset', preset.label); } catch {}
    const sp = new URLSearchParams(params.toString());
    sp.set('fra', preset.fra);
    sp.set('til', preset.til);
    router.replace(`?${sp.toString()}`, { scroll: false });
    setÅben(false);
    onLuk?.();
  }, [params, router, onLuk]);

  // Sæt default preset hvis ingen periode er valgt i URL
  useEffect(() => {
    if (!fraParam) {
      const gemetLabel = (() => { try { return localStorage.getItem('keascare-dato-preset'); } catch { return null; } })();
      const presets = getPresets();
      const valgtPreset = presets.find((p) => p.label === gemetLabel) ?? presets.find((p) => p.label === DEFAULT_PRESET_LABEL) ?? presets[3];
      const sp = new URLSearchParams(params.toString());
      sp.set('fra', valgtPreset.fra);
      sp.set('til', valgtPreset.til);
      router.replace(`?${sp.toString()}`, { scroll: false });
    }
  }, [fraParam, params, router]);

  // Opdater `til` i URL'en til dags dato ved hvert sidebesøg
  // så nye rapporter ikke skæres fra af en gammel `til`-dato.
  // Undtagelse: preset med fastTil=true (fx "Sidste år") skal ikke opdateres.
  useEffect(() => {
    const tilParam = params.get('til');
    const dagensDato = idag();
    if (tilParam && tilParam !== dagensDato) {
      const matchetPreset = findPreset(fraParam);
      if (matchetPreset && !matchetPreset.fastTil) {
        const sp = new URLSearchParams(params.toString());
        sp.set('til', dagensDato);
        router.replace(`?${sp.toString()}`, { scroll: false });
      }
    }
  }, []); // Kør kun ved mount

  useEffect(() => {
    if (!åben) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setÅben(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [åben]);

  const presets = getPresets();

  if (variant === 'mobil') {
    return (
      <div className="datovælger-mobil">
        <p className="datovælger-mobil-titel">Vælg periode</p>
        <div className="datovælger-presets">
          {presets.map((preset) => (
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
          {presets.map((preset) => (
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
