// src/features/markedsforing/components/shared/InfoTooltip/InfoTooltip.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

type Props = {
  tekst: string;
};

export function InfoTooltip({ tekst }: Props) {
  const [åben, setÅben] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!åben) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setÅben(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [åben]);

  return (
    <span ref={ref} className="info-tooltip-wrap">
      <button
        className="info-tooltip-ikon-knap"
        onClick={() => setÅben((v) => !v)}
        aria-label="Vis forklaring"
        type="button"
      >
        <Info size={14} className={`info-tooltip-ikon${åben ? ' aktiv' : ''}`} />
      </button>

      {åben && (
        <span className="info-tooltip-boble synlig">
          <button
            className="info-tooltip-luk"
            onClick={() => setÅben(false)}
            aria-label="Luk"
            type="button"
          >
            <X size={12} />
          </button>
          {tekst}
        </span>
      )}
    </span>
  );
}
