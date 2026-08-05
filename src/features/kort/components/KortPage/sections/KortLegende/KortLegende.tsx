// src/features/kort/components/KortPage/sections/KortLegende/KortLegende.tsx

'use client';

export type FundFilter = 'kritisk' | 'stoerre' | 'mindre' | 'ingen' | 'ukendt' | 'kunder';

export const LEGENDE_ITEMS: { id: FundFilter; farve: string; label: string }[] = [
  { id: 'kritisk', farve: '#ef4444', label: 'Kritiske fund' },
  { id: 'stoerre', farve: '#f97316', label: 'Større fund' },
  { id: 'mindre',  farve: '#eab308', label: 'Mindre fund' },
  { id: 'ingen',   farve: '#22c55e', label: 'Ingen fund' },
  { id: 'ukendt',  farve: '#6b7280', label: 'Ukendt' },
  { id: 'kunder',  farve: '#4f46e5', label: 'Kunder' },
];

type Props = {
  aktive: Set<FundFilter>;
  onToggle: (id: FundFilter) => void;
};

export function KortLegende({ aktive, onToggle }: Props) {
  const ingenAktive = aktive.size === 0;
  return (
    <div className="kort-legende">
      {LEGENDE_ITEMS.map(({ id, farve, label }) => {
        const erMarkeret = aktive.has(id);
        const erDæmpet   = !ingenAktive && !erMarkeret;
        return (
          <button
            key={id}
            className={`kort-legende-item kort-legende-knap${erMarkeret ? ' kort-legende-aktiv' : ''}`}
            onClick={() => onToggle(id)}
            title={erMarkeret ? `Fjern filter: ${label}` : `Filtrer til: ${label}`}
          >
            <div
              className="kort-legende-dot"
              style={{ background: farve, opacity: erDæmpet ? 0.25 : 1 }}
            />
            <span style={{ opacity: erDæmpet ? 0.35 : 1 }}>{label}</span>
            {erMarkeret && <span className="kort-legende-check">✓</span>}
          </button>
        );
      })}
      {aktive.size > 0 && (
        <button
          className="kort-filter-ryd"
          style={{ marginTop: '0.35rem' }}
          onClick={() => { const copy = new Set(aktive); copy.forEach((id) => onToggle(id)); }}
        >
          × Ryd filtre
        </button>
      )}
    </div>
  );
}
