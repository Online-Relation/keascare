// src/components/TilsynskildeIkon/TilsynskildeIkon.tsx

import Image from 'next/image';

export type Tilsynskilde = 'stps' | 'socialtilsyn';

type Props = {
  kilde: Tilsynskilde;
  størrelse?: number;
  visTekst?: boolean;
};

const KILDE_META: Record<Tilsynskilde, { ikon: string; label: string; farve: string }> = {
  stps: {
    ikon:   '/images/icons/stps-favicon.webp',
    label:  'STPS',
    farve:  '#003057',
  },
  socialtilsyn: {
    ikon:   '/images/icons/socialtilsyn.svg',
    label:  'Socialtilsyn',
    farve:  '#032D44',
  },
};

export function TilsynskildeIkon({ kilde, størrelse = 16, visTekst = false }: Props) {
  const meta = KILDE_META[kilde];

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
      title={meta.label}
    >
      <Image
        src={meta.ikon}
        alt={meta.label}
        width={størrelse}
        height={størrelse}
        style={{ borderRadius: 3, flexShrink: 0 }}
      />
      {visTekst && (
        <span style={{ fontSize: '0.75rem', color: meta.farve, fontWeight: 600 }}>
          {meta.label}
        </span>
      )}
    </span>
  );
}
