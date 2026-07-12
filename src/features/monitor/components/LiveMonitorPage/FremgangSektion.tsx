// src/features/monitor/components/LiveMonitorPage/FremgangSektion.tsx

import { useEffect, useRef, useState } from 'react';
import type { FremgangItem } from '@/app/api/scrapers/fremgang/route';
import type { FremgangSnapshot } from '@/app/api/scrapers/fremgang/historik/route';

// ── Mini sparkline ────────────────────────────────────────────────────────────

function MiniSparkline({ værdier, accent }: { værdier: number[]; accent: string }) {
  if (værdier.length < 2) return <div style={{ width: 80, height: 28 }} />;
  const w = 80, h = 28;
  const min = Math.min(...værdier);
  const max = Math.max(...værdier, min + 1);
  const pts = værdier.map((v, i) => {
    const x = (i / (værdier.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const stigning = værdier[værdier.length - 1] - værdier[0];
  const farve = stigning > 0 ? '#22c55e' : stigning === 0 ? accent : '#ef4444';
  const sidst = værdier[værdier.length - 1];
  const px = w;
  const py = h - ((sidst - min) / (max - min)) * (h - 4) - 2;
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={farve} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
      <circle cx={px} cy={py} r={2.5} fill={farve} />
    </svg>
  );
}

// ── FremgangKort ──────────────────────────────────────────────────────────────

type Kort = {
  item: FremgangItem;
  historik: FremgangSnapshot[];
  accent: string;
};

const NØGLE_MAP: Record<string, keyof FremgangSnapshot> = {
  'pdf':        'pdf',
  'fund-items': 'fund',
  'cvr':        'cvr',
  'tp-match':   'tp',
  'pnummer':    'pnr',
};

function FremgangKort({ item, historik, accent }: Kort) {
  const nøgle = NØGLE_MAP[item.id];
  const sparkVærdier = historik.map((s) => (nøgle ? s[nøgle] as number : 0));
  const deltaLabel = (() => {
    if (historik.length < 2 || !nøgle) return null;
    const start = historik[0][nøgle] as number;
    const slut  = historik[historik.length - 1][nøgle] as number;
    const diff = slut - start;
    if (diff === 0) return null;
    return { diff, positiv: diff > 0 };
  })();

  return (
    <div style={{
      background: '#0b1120', borderRadius: 10, padding: '0.7rem 0.9rem',
      border: `1px solid ${accent}22`, borderLeft: `3px solid ${accent}`,
      display: 'flex', flexDirection: 'column', gap: '0.35rem',
    }}>
      {/* Label + sparkline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase' }}>
            {item.label}
          </div>
          <div style={{ fontSize: '0.54rem', color: '#334155', marginTop: '0.1rem' }}>{item.beskrivelse}</div>
        </div>
        <MiniSparkline værdier={sparkVærdier} accent={accent} />
      </div>

      {/* Tal-linje */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: accent }}>
          {item.nuværende.toLocaleString('da-DK')}
        </span>
        <span style={{ fontSize: '0.6rem', color: '#475569' }}>/ {item.mål.toLocaleString('da-DK')}</span>
        {deltaLabel && (
          <span style={{
            fontSize: '0.6rem', fontWeight: 700,
            color: deltaLabel.positiv ? '#22c55e' : '#ef4444',
            marginLeft: 'auto',
          }}>
            {deltaLabel.positiv ? '+' : ''}{deltaLabel.diff.toLocaleString('da-DK')} i perioden
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#0f1f33', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${item.pct}%`,
          background: `linear-gradient(90deg, ${accent}66, ${accent})`,
          borderRadius: 4, transition: 'width 1.2s ease',
        }} />
      </div>

      <div style={{ fontSize: '0.54rem', color: '#334155' }}>{item.pct}% af {item.mål.toLocaleString('da-DK')} rapporter</div>
    </div>
  );
}

// ── Accenter per kategori ─────────────────────────────────────────────────────

const ACCENT_MAP: Record<string, string> = {
  'pdf':        '#38bdf8',
  'fund-items': '#a78bfa',
  'pnummer':    '#f59e0b',
  'cvr':        '#22c55e',
  'tp-match':   '#fb923c',
};

// ── TilbudsportalenStatus ─────────────────────────────────────────────────────

type TpStatus = { total: number; mangler: number; matchet: number; medCvr: number };

function useKørselStatus(mangler: number | undefined) {
  const forrigeMangler = useRef<number | null>(null);
  const sidsteÆndring  = useRef<Date | null>(null);
  const startMangler   = useRef<number | null>(null);
  const startTid       = useRef<Date | null>(null);
  const [status, setStatus] = useState<'idle' | 'kører' | 'færdig'>('idle');
  const [færdigKl, setFærdigKl] = useState<string | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  useEffect(() => {
    if (mangler === undefined) return;

    if (forrigeMangler.current === null) {
      forrigeMangler.current = mangler;
      return;
    }

    if (mangler < forrigeMangler.current) {
      // Tallet faldt — kørsel er i gang
      if (status !== 'kører') {
        startMangler.current = forrigeMangler.current;
        startTid.current = new Date();
      }
      forrigeMangler.current = mangler;
      sidsteÆndring.current = new Date();
      setStatus('kører');
      setFærdigKl(null);

      // Beregn ETA
      if (startMangler.current !== null && startTid.current !== null && mangler > 0) {
        const behandlet = startMangler.current - mangler;
        const elapsedMin = (Date.now() - startTid.current.getTime()) / 60_000;
        if (behandlet > 0 && elapsedMin > 0) {
          const ratePerMin = behandlet / elapsedMin;
          const minTilbage = mangler / ratePerMin;
          if (minTilbage < 600) {
            const etaDato = new Date(Date.now() + minTilbage * 60_000);
            const etaStr = etaDato.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
            const minRund = Math.round(minTilbage);
            setEta(`~${minRund} min · kl. ${etaStr}`);
          }
        }
      }
      return;
    }

    // Ingen ændring siden sidst
    if (status === 'kører' && sidsteÆndring.current) {
      const stilleMs = Date.now() - sidsteÆndring.current.getTime();
      if (stilleMs > 120_000) {
        setStatus('færdig');
        setFærdigKl(sidsteÆndring.current.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }));
        setEta(null);
      }
    }
  }, [mangler, status]);

  return { status, færdigKl, eta };
}

function TpStatusKort({ tp }: { tp: TpStatus }) {
  const medDetaljer = tp.total - tp.mangler;
  const pctDetaljer = tp.total > 0 ? Math.round((medDetaljer / tp.total) * 100) : 0;
  const pctCvr      = tp.total > 0 ? Math.round((tp.medCvr   / tp.total) * 100) : 0;
  const { status, færdigKl, eta } = useKørselStatus(tp.mangler);

  const rækker = [
    { label: 'Detaljer hentet', antal: medDetaljer, pct: pctDetaljer, accent: '#38bdf8' },
    { label: 'CVR fundet',      antal: tp.medCvr,   pct: pctCvr,      accent: '#22c55e' },
    { label: 'Matchet m. STPS', antal: tp.matchet,  pct: tp.total > 0 ? Math.round((tp.matchet / tp.total) * 100) : 0, accent: '#a78bfa' },
  ];

  const statusBadge = (() => {
    if (status === 'kører')  return { tekst: 'Kørsel i gang...', farve: '#38bdf8', animation: 'liveBlink 2s ease-in-out infinite' };
    if (status === 'færdig') return { tekst: `Færdig kl. ${færdigKl}`, farve: '#22c55e', animation: undefined };
    return null;
  })();

  return (
    <div style={{
      background: '#0b1120', borderRadius: 10, padding: '0.7rem 0.9rem',
      border: `1px solid ${status === 'kører' ? '#38bdf833' : '#38bdf822'}`,
      borderLeft: `3px solid ${status === 'kører' ? '#38bdf8' : status === 'færdig' ? '#22c55e' : '#38bdf8'}`,
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase' }}>
            Tilbudsportalen
          </span>
          {statusBadge && (
            <span style={{
              fontSize: '0.52rem', fontWeight: 700, color: statusBadge.farve,
              animation: statusBadge.animation,
            }}>
              {status === 'kører' && <span style={{ marginRight: '0.2rem' }}>●</span>}
              {statusBadge.tekst}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.6rem', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
          {tp.total.toLocaleString('da-DK')} tilbud i alt
        </span>
      </div>

      {rækker.map((r) => (
        <div key={r.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.55rem', color: '#64748b' }}>{r.label}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: r.accent, fontVariantNumeric: 'tabular-nums' }}>
              {r.antal.toLocaleString('da-DK')} <span style={{ color: '#475569', fontWeight: 400 }}>({r.pct}%)</span>
            </span>
          </div>
          <div style={{ height: 3, background: '#0f1f33', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${r.pct}%`,
              background: `linear-gradient(90deg, ${r.accent}55, ${r.accent})`,
              borderRadius: 2, transition: 'width 1s ease',
            }} />
          </div>
        </div>
      ))}

      {tp.mangler > 0 && status !== 'færdig' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.1rem' }}>
          <span style={{ fontSize: '0.54rem', color: status === 'kører' ? '#38bdf8' : '#f59e0b' }}>
            {tp.mangler.toLocaleString('da-DK')} mangler stadig detaljer
          </span>
          {eta && status === 'kører' && (
            <span style={{ fontSize: '0.54rem', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
              Est. færdig om {eta}
            </span>
          )}
        </div>
      )}
      {status === 'færdig' && tp.mangler === 0 && (
        <div style={{ fontSize: '0.54rem', color: '#22c55e', marginTop: '0.1rem' }}>
          Alle detaljer hentet
        </div>
      )}
    </div>
  );
}

// ── FremgangSektion (hoved-eksport) ───────────────────────────────────────────

type FremgangResponse = { total: number; items: FremgangItem[] };

const POLL_TP = 20_000;

export function FremgangSektion({ fra, til }: { fra: string | null; til: string | null }) {
  const [data,        setData]        = useState<FremgangResponse | null>(null);
  const [historik,    setHistorik]    = useState<FremgangSnapshot[]>([]);
  const [tp,          setTp]          = useState<TpStatus | null>(null);
  const [tpOpdateret, setTpOpdateret] = useState<string | null>(null);

  useEffect(() => {
    async function hent() {
      try {
        const params = new URLSearchParams();
        if (fra) params.set('fra', fra);
        if (til) params.set('til', til);
        const [resData, resHist] = await Promise.all([
          fetch('/api/scrapers/fremgang').then(r => r.json()) as Promise<FremgangResponse>,
          fetch(`/api/scrapers/fremgang/historik?${params}`).then(r => r.json()) as Promise<FremgangSnapshot[]>,
        ]);
        setData(resData);
        setHistorik(Array.isArray(resHist) ? resHist : []);
      } catch { /* ignore */ }
    }
    hent();
  }, [fra, til]);

  useEffect(() => {
    async function hentTp() {
      try {
        const res = await fetch('/api/scrapers/tilbudsportalen/status');
        setTp(await res.json() as TpStatus);
        setTpOpdateret(new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch { /* ignore */ }
    }
    hentTp();
    const id = setInterval(hentTp, POLL_TP);
    return () => clearInterval(id);
  }, []);

  if (!data) return null;

  return (
    <div style={{ flexShrink: 0 }}>
      {/* ── STPS databasefremgang ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.14em', color: '#334155', textTransform: 'uppercase' }}>
          Databasefremgang
        </span>
        <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
        <span style={{ fontSize: '0.52rem', color: '#334155' }}>
          {historik.length > 0
            ? `${historik.length} snapshots · ${data.total.toLocaleString('da-DK')} STPS-rapporter`
            : `${data.total.toLocaleString('da-DK')} STPS-rapporter`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {data.items.map((item) => (
          <FremgangKort
            key={item.id}
            item={item}
            historik={historik}
            accent={ACCENT_MAP[item.id] ?? '#64748b'}
          />
        ))}
      </div>

      {/* ── Tilbudsportalen ── */}
      {tp && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.14em', color: '#334155', textTransform: 'uppercase' }}>
              Tilbudsportalen
            </span>
            <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
            <span style={{ fontSize: '0.52rem', color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
              {tpOpdateret ? `Tjekket kl. ${tpOpdateret}` : 'opdaterer hvert 20s'}
            </span>
          </div>
          <TpStatusKort tp={tp} />
        </>
      )}
    </div>
  );
}
