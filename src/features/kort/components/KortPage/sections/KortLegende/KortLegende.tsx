// src/features/kort/components/KortPage/sections/KortLegende/KortLegende.tsx

const LEGENDE = [
  { farve: '#ef4444', label: 'Kritiske fund' },
  { farve: '#f97316', label: 'Større fund' },
  { farve: '#eab308', label: 'Mindre fund' },
  { farve: '#22c55e', label: 'Ingen fund' },
  { farve: '#6b7280', label: 'Ukendt' },
];

export function KortLegende() {
  return (
    <div className="kort-legende">
      {LEGENDE.map(({ farve, label }) => (
        <div key={label} className="kort-legende-item">
          <div className="kort-legende-dot" style={{ background: farve }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
