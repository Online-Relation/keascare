// src/features/markedsdata/components/MarkedsdataPage/sections/MarkedsdataNavigering/MarkedsdataNavigering.tsx

type Trin = {
  nr: number;
  titel: string;
  beskrivelse: string;
};

const TRIN: Trin[] = [
  {
    nr: 1,
    titel: 'Hvor er mulighederne?',
    beskrivelse: 'Få et hurtigt overblik over markedets signaler og hvor KeasCare kan skabe størst værdi.',
  },
  {
    nr: 2,
    titel: 'Hvilke bosteder bør vi prioritere?',
    beskrivelse: 'Se en prioriteret liste baseret på fund, relation, kontaktstatus og markedsmulighed.',
  },
  {
    nr: 3,
    titel: 'Hvordan går salgsarbejdet?',
    beskrivelse: 'Se fremdrift, bearbejdningsstatus og opfølgning på markedet.',
  },
];

export function MarkedsdataNavigering() {
  return (
    <div className="md-nav">
      {TRIN.map((trin, i) => (
        <div key={trin.nr} className="md-nav-trin-wrapper">
          <div className={`md-nav-trin ${i === 0 ? 'md-nav-trin--aktiv' : ''}`}>
            <span className="md-nav-trin-nr">{trin.nr}</span>
            <div>
              <p className="md-nav-trin-titel">{trin.titel}</p>
              <p className="md-nav-trin-beskrivelse">{trin.beskrivelse}</p>
            </div>
          </div>
          {i < TRIN.length - 1 && <span className="md-nav-pil">→</span>}
        </div>
      ))}
    </div>
  );
}
