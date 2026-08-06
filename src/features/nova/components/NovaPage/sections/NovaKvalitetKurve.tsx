// src/features/nova/components/NovaPage/sections/NovaKvalitetKurve.tsx
// SVG-linjekurve over daglig kvalitetsscore — ingen eksterne biblioteker

type SnapshotPunkt = {
  snapshot_dato: string;
  score:         number;
};

type Props = { snapshots: SnapshotPunkt[] };

const KURVE_H = 120;
const KURVE_W = 600;
const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 28;

function formatKortDato(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function NovaKvalitetKurve({ snapshots }: Props) {
  if (snapshots.length < 2) {
    return (
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: '0 0 0.5rem' }}>
          Kvalitetsscore over tid
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Kurven vises når der er mindst 2 daglige snapshots — kommer automatisk efter næste kørsel.
        </p>
      </div>
    );
  }

  // Kronologisk rækkefølge (ældste først)
  const punkter = [...snapshots].reverse();
  const scores = punkter.map((p) => p.score);
  const minScore = Math.max(0,  Math.min(...scores) - 5);
  const maxScore = Math.min(100, Math.max(...scores) + 5);

  const indreW = KURVE_W - PAD_L - PAD_R;
  const indreH = KURVE_H - PAD_T - PAD_B;

  function xPos(i: number) {
    return PAD_L + (i / (punkter.length - 1)) * indreW;
  }
  function yPos(score: number) {
    return PAD_T + indreH - ((score - minScore) / (maxScore - minScore)) * indreH;
  }

  const pathD = punkter
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(p.score).toFixed(1)}`)
    .join(' ');

  // Fyldareal under kurven
  const areaD = `${pathD} L ${xPos(punkter.length - 1).toFixed(1)} ${(PAD_T + indreH).toFixed(1)} L ${PAD_L} ${(PAD_T + indreH).toFixed(1)} Z`;

  const senestScore = punkter.at(-1)?.score ?? 0;
  const foerstScore = punkter[0]?.score ?? 0;
  const diff = senestScore - foerstScore;
  const diffTekst = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '±0';
  const diffFarve = diff > 0 ? 'var(--color-success)' : diff < 0 ? 'var(--color-accent)' : 'var(--color-text-muted)';

  // Vis maks 8 x-labels jævnt fordelt
  const labelIndekser = punkter.length <= 8
    ? punkter.map((_, i) => i)
    : [0, ...Array.from({ length: 6 }, (_, i) => Math.round((i + 1) * (punkter.length - 1) / 7)), punkter.length - 1];

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: '1.5rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>Kvalitetsscore over tid</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            {punkter.length} daglige snapshots
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{senestScore}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 2 }}>/100</span>
          <p style={{ fontSize: '0.7rem', color: diffFarve, margin: '0.2rem 0 0', fontWeight: 600 }}>
            {diffTekst} siden start
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${KURVE_W} ${KURVE_H}`}
          style={{ width: '100%', maxWidth: KURVE_W, display: 'block' }}
          aria-label="Kvalitetsscore over tid"
        >
          <defs>
            <linearGradient id="kurve-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Vandrette gitterlinjer ved 25, 50, 75, 100 */}
          {[25, 50, 75, 100].map((v) => {
            const y = yPos(v);
            if (y < PAD_T || y > PAD_T + indreH) return null;
            return (
              <g key={v}>
                <line x1={PAD_L} y1={y} x2={KURVE_W - PAD_R} y2={y}
                  stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray="3 3" />
                <text x={PAD_L - 4} y={y + 4} textAnchor="end"
                  fontSize={9} fill="var(--color-text-muted)">{v}</text>
              </g>
            );
          })}

          {/* Fyldareal */}
          <path d={areaD} fill="url(#kurve-gradient)" />

          {/* Kurvelinje */}
          <path d={pathD} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Datapunkter */}
          {punkter.map((p, i) => (
            <circle key={i} cx={xPos(i)} cy={yPos(p.score)} r={3}
              fill="#0ea5e9" stroke="var(--color-bg-card)" strokeWidth={1.5}>
              <title>{formatKortDato(p.snapshot_dato)}: {p.score}/100</title>
            </circle>
          ))}

          {/* X-akse labels */}
          {labelIndekser.map((i) => (
            <text key={i} x={xPos(i)} y={KURVE_H - 4}
              textAnchor="middle" fontSize={9} fill="var(--color-text-muted)">
              {formatKortDato(punkter[i].snapshot_dato)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
