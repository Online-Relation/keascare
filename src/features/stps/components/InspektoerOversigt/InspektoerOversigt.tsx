// src/features/stps/components/InspektoerOversigt/InspektoerOversigt.tsx

import type { InspektoerStat } from '@/features/stps/services/StpsInspektoerService';

type Props = {
  inspektoerer: InspektoerStat[];
};

export function InspektoerOversigt({ inspektoerer }: Props) {
  if (inspektoerer.length === 0) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        Ingen inspektørdata endnu — data hentes automatisk ved næste PDF-parsing.
      </div>
    );
  }

  const max = inspektoerer[0]?.antal ?? 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {inspektoerer.map((ins) => (
        <div
          key={ins.navn}
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr 60px',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.625rem 0.875rem',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
          }}
        >
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text-primary)', margin: 0 }}>
              {ins.navn}
            </p>
            {ins.titel && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
                {ins.titel}
              </p>
            )}
          </div>
          <div style={{ position: 'relative', height: 8, background: 'var(--color-border-light)', borderRadius: 9999 }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                borderRadius: 9999,
                background: 'var(--color-primary)',
                width: `${Math.round((ins.antal / max) * 100)}%`,
              }}
            />
          </div>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--color-text-primary)', margin: 0, textAlign: 'right' }}>
            {ins.antal} {ins.antal === 1 ? 'tilsyn' : 'tilsyn'}
          </p>
        </div>
      ))}
    </div>
  );
}
