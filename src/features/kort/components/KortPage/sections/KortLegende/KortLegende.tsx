// src/features/kort/components/KortPage/sections/KortLegende/KortLegende.tsx

const LEGENDE = [
  { farve: '#3b82f6', label: 'Eksisterende kunde' },
  { farve: '#ef4444', label: 'Ikke kunde' },
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
