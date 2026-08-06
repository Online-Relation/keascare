// src/features/nova/components/NovaPage/sections/NovaKvalitetsoversigt.tsx

type Datakvalitet = {
  total:      number;
  medCvr:     number;
  medTp:      number;
  medKontakt: number;
  medPdf:     number;
  medMonday:  number;
  medLos:     number;
};

type KvalitetsDimension = {
  label:       string;
  antal:       number;
  total:       number;
  beskrivelse: string;
};

function pct(antal: number, total: number) {
  if (total === 0) return 0;
  return Math.round((antal / total) * 100);
}

// Samlet score: vægtet gennemsnit af alle dimensioner
function beregnSamletScore(d: Datakvalitet): number {
  if (d.total === 0) return 0;
  const vægte = [
    { v: 20, pct: pct(d.medCvr,     d.total) },
    { v: 20, pct: pct(d.medTp,      d.total) },
    { v: 15, pct: pct(d.medKontakt, d.total) },
    { v: 20, pct: pct(d.medPdf,     d.total) },
    { v: 15, pct: pct(d.medMonday,  d.total) },
    { v: 10, pct: pct(d.medLos,     d.total) },
  ];
  const score = vægte.reduce((sum, { v, pct: p }) => sum + (v * p) / 100, 0);
  return Math.round(score);
}

function scorefarve(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

function DimensionRække({ label, antal, total, beskrivelse }: KvalitetsDimension) {
  const procent = pct(antal, total);
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {antal.toLocaleString('da-DK')} / {total.toLocaleString('da-DK')} ({procent}%)
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 3,
        background: 'var(--color-border)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${procent}%`,
          borderRadius: 3,
          background: scorefarve(procent),
          transition: 'width 0.6s ease',
        }} />
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
        {beskrivelse}
      </p>
    </div>
  );
}

export function NovaKvalitetsoversigt({ datakvalitet: d }: { datakvalitet: Datakvalitet }) {
  const score = beregnSamletScore(d);
  const farve = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';

  const dimensioner: KvalitetsDimension[] = [
    { label: 'CVR-nummer',      antal: d.medCvr,     total: d.total, beskrivelse: 'Bosteder vi kan slå op i CVR og berige med virksomhedsdata' },
    { label: 'Tilbudsportalen', antal: d.medTp,       total: d.total, beskrivelse: 'Bosteder matchet mod Tilbudsportalen med tilbudstype og pladser' },
    { label: 'Kontaktdata',     antal: d.medKontakt,  total: d.total, beskrivelse: 'Bosteder med telefon eller email fra Tilbudsportalen' },
    { label: 'PDF analyseret',  antal: d.medPdf,      total: d.total, beskrivelse: 'Bosteder hvor vi har udtrukket fund og vurdering fra STPS-rapporten' },
    { label: 'Monday-status',   antal: d.medMonday,   total: d.total, beskrivelse: 'Bosteder matchet mod Monday CRM' },
    { label: 'LOS-status',      antal: d.medLos,      total: d.total, beskrivelse: 'Bosteder hvor LOS-medlemskab er tjekket' },
  ];

  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>Datakvalitet</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
              På tværs af {d.total.toLocaleString('da-DK')} STPS-rapporter
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: farve, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginLeft: 2 }}>/100</span>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
              Samlet score
            </p>
          </div>
        </div>

        {dimensioner.map((dim) => (
          <DimensionRække key={dim.label} {...dim} />
        ))}
      </div>
    </section>
  );
}
