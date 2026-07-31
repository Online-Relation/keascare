'use client';

// SVG donut: MRR vs engangsomsætning

type Props = {
  mrr: number;
  engangs: number;
};

export function RevenueDonut({ mrr, engangs }: Props) {
  const total = mrr + engangs;
  if (total === 0) return null;

  const size = 130;
  const cx = size / 2;
  const cy = size / 2;
  const r = 48;
  const strokeW = 18;
  const gap = 3;
  const circ = 2 * Math.PI * r;

  const mrrPct = mrr / total;
  const engangsPct = engangs / total;

  // Segment: MRR (violet)
  const mrrLen = circ * mrrPct - gap;
  const engangsLen = circ * engangsPct - gap;
  const engangsOffset = circ * mrrPct + gap / 2;

  const fmt = (v: number) =>
    new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(v);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <svg width={size} height={size} style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.3))' }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeW} />
        {/* MRR — violet */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#a78bfa"
          strokeWidth={strokeW}
          strokeDasharray={`${mrrLen} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
        />
        {/* Engangs — sky */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={strokeW}
          strokeDasharray={`${engangsLen} ${circ}`}
          strokeDashoffset={-(engangsOffset - circ / 4)}
          strokeLinecap="round"
        />
        {/* Center tekst */}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="800">
          {Math.round(mrrPct * 100)}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">
          MRR
        </text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a78bfa', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MRR</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{fmt(mrr)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Engangs</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{fmt(engangs)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
