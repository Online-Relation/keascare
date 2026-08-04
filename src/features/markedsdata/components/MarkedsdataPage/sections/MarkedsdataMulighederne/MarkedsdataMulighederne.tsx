// src/features/markedsdata/components/MarkedsdataPage/sections/MarkedsdataMulighederne/MarkedsdataMulighederne.tsx

import { AlertTriangle, Clock, Building2, Users } from 'lucide-react';
import { BorgereÅrChart } from '../../charts/BorgereÅrChart';
import { ParagrafÅrBarChart } from '../../charts/ParagrafÅrBarChart';
import type { MarkedsdataStats, OpmærksomhedSignal } from '@/features/markedsdata/types/markedsdata.types';
import type { DstKommuneRå, DstÅrTotal } from '@/lib/api/DstClient';

type Props = {
  stats: MarkedsdataStats;
  dstData: DstKommuneRå[];
  årligeData: DstÅrTotal[];
  kvartal: string | null;
};

const KPI_FARVER: Record<number, { tekst: string; ikon: string }> = {
  0: { tekst: 'var(--color-text-primary)', ikon: '#6366f1' },
  1: { tekst: '#16a34a', ikon: '#16a34a' },
  2: { tekst: '#dc2626', ikon: '#dc2626' },
  3: { tekst: '#d97706', ikon: '#d97706' },
  4: { tekst: 'var(--color-text-primary)', ikon: '#6366f1' },
};

function OpmærksomhedIkon({ type }: { type: OpmærksomhedSignal['type'] }) {
  if (type === 'nye_fund') return <AlertTriangle size={16} color="#dc2626" />;
  if (type === 'opfoelgning') return <Clock size={16} color="#d97706" />;
  if (type === 'ingen_kunder') return <Building2 size={16} color="#6366f1" />;
  return <Users size={16} color="#d97706" />;
}

function opmærksomhedFarve(type: OpmærksomhedSignal['type']): string {
  if (type === 'nye_fund') return '#dc2626';
  if (type === 'opfoelgning') return '#d97706';
  if (type === 'ingen_kunder') return '#6366f1';
  return '#d97706';
}

export function MarkedsdataMulighederne({ stats, dstData, årligeData, kvartal }: Props) {
  const kpis = [
    { label: 'Relevante bosteder', værdi: stats.totalBosteder.toLocaleString('da-DK'), sub: 'Potentielt relevante i markedet' },
    { label: 'KeasCare-kunder', værdi: stats.antalKunder.toLocaleString('da-DK'), sub: 'Allerede aktive kunder' },
    { label: 'Kritiske / større fund', værdi: stats.antalKritiskeEllerStoerre.toLocaleString('da-DK'), sub: 'Bosteder med kritiske eller større fund' },
    { label: 'Aldrig kontaktet', værdi: stats.antalAldrigKontaktet.toLocaleString('da-DK'), sub: 'Aldrig kontaktet af KeasCare' },
    { label: 'Kommuner med potentiale', værdi: stats.kommunerMedData.toLocaleString('da-DK'), sub: 'Kommuner med relevante bosteder' },
  ];

  const top5 = dstData.slice(0, 5);
  const maxBorgere = top5[0]?.total ?? 1;

  return (
    <div className="md-sektion">
      <div className="md-sektion-header">
        <span className="md-sektion-nr">1</span>
        <div>
          <h2 className="md-sektion-titel">Hvor er mulighederne?</h2>
          <p className="md-sektion-sub">Få et hurtigt overblik over markedets signaler og hvor KeasCare har størst mulighed for at skabe værdi.</p>
        </div>
      </div>

      <div className="md-kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className="md-kpi-kort">
            <span className="md-kpi-label">{kpi.label}</span>
            <span className="md-kpi-tal" style={{ color: KPI_FARVER[i]?.tekst }}>{kpi.værdi}</span>
            <span className="md-kpi-sub">{kpi.sub}</span>
          </div>
        ))}
      </div>

      <div className="md-to-kolonner">
        <div className="md-kort">
          <h3 className="md-kort-titel">Kommuner med størst potentiale</h3>
          <div className="md-kommune-liste">
            {top5.map((k, i) => (
              <div key={k.kommune} className="md-kommune-linje">
                <span className="md-kommune-nr">{i + 1}</span>
                <span className="md-kommune-navn">{k.kommune}</span>
                <div className="md-kommune-bar-track">
                  <div
                    className="md-kommune-bar-fill"
                    style={{ width: `${(k.total / maxBorgere) * 100}%` }}
                  />
                </div>
                <span className="md-kommune-tal">{k.total.toLocaleString('da-DK')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md-kort">
          <h3 className="md-kort-titel">Hvad kræver opmærksomhed nu?</h3>
          <div className="md-opmærksomhed-liste">
            {stats.opmærksomhedssignaler.map((s) => (
              <div key={s.type} className="md-opmærksomhed-linje">
                <OpmærksomhedIkon type={s.type} />
                <div className="md-opmærksomhed-tekst">
                  <span className="md-opmærksomhed-label">{s.label}</span>
                  <span className="md-opmærksomhed-beskrivelse">{s.beskrivelse}</span>
                </div>
                <span className="md-opmærksomhed-tal" style={{ color: opmærksomhedFarve(s.type) }}>
                  {s.antal.toLocaleString('da-DK')}
                </span>
                <span className="md-opmærksomhed-pil">›</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="md-to-kolonner">
        <div className="md-kort">
          <h3 className="md-kort-titel">Borgere i §107/§108 botilbud – 2016 til i dag</h3>
          <p className="md-kort-sub">Historisk udvikling på landsplan{kvartal ? ` · Seneste: ${kvartal}` : ''} · Kilde: Danmarks Statistik</p>
          <BorgereÅrChart data={årligeData} />
        </div>

        <div className="md-kort">
          <h3 className="md-kort-titel">§107 vs. §108 nationalt over tid</h3>
          <p className="md-kort-sub">Sammenligning af udvikling i antal borgere pr. paragraftype · Kilde: Danmarks Statistik</p>
          <ParagrafÅrBarChart data={årligeData} />
        </div>
      </div>
    </div>
  );
}
