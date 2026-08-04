// src/features/markedsdata/components/MarkedsdataPage/sections/MarkedsdataSalgsarbejdet/MarkedsdataSalgsarbejdet.tsx

import { ArrowRight } from 'lucide-react';
import type { MarkedsdataStats } from '@/features/markedsdata/types/markedsdata.types';

type Props = { stats: MarkedsdataStats };

type PipelineTrin = {
  label: string;
  antal: number;
  farve: string;
};

export function MarkedsdataSalgsarbejdet({ stats }: Props) {
  const urørt = stats.antalAldrigKontaktet;
  const kontaktet = stats.totalBosteder - urørt;
  const kunder = stats.antalKunder;

  const pipeline: PipelineTrin[] = [
    { label: 'Relevante bosteder', antal: stats.totalBosteder, farve: '#6366f1' },
    { label: 'Kontaktet', antal: kontaktet, farve: '#3b82f6' },
    { label: 'Kunder', antal: kunder, farve: '#22c55e' },
  ];

  const bearbejdningsPct = stats.totalBosteder > 0
    ? Math.round((kontaktet / stats.totalBosteder) * 100)
    : 0;
  const kundePct = stats.totalBosteder > 0
    ? Math.round((kunder / stats.totalBosteder) * 100)
    : 0;
  const urørtPct = stats.totalBosteder > 0
    ? Math.round((urørt / stats.totalBosteder) * 100)
    : 0;

  return (
    <div className="md-sektion">
      <div className="md-sektion-header">
        <span className="md-sektion-nr">3</span>
        <div>
          <h2 className="md-sektion-titel">Hvordan går salgsarbejdet?</h2>
          <p className="md-sektion-sub">Se den samlede bevægelse i salgsprocessen, bearbejdningsstatus og opfølgning på markedet.</p>
        </div>
      </div>

      <div className="md-salg-grid">

        <div className="md-kort">
          <h3 className="md-kort-titel">Fremdrift i markedet</h3>
          <div className="md-pipeline">
            {pipeline.map((trin, i) => (
              <div key={trin.label} className="md-pipeline-trin-wrapper">
                <div className="md-pipeline-trin" style={{ borderColor: trin.farve }}>
                  <span className="md-pipeline-antal" style={{ color: trin.farve }}>
                    {trin.antal.toLocaleString('da-DK')}
                  </span>
                  <span className="md-pipeline-label">{trin.label}</span>
                  {i > 0 && (
                    <span className="md-pipeline-pct">
                      {Math.round((trin.antal / stats.totalBosteder) * 100)}%
                    </span>
                  )}
                </div>
                {i < pipeline.length - 1 && (
                  <ArrowRight size={18} className="md-pipeline-pil" />
                )}
              </div>
            ))}
          </div>
          <p className="md-pipeline-note">
            Konverteringsrate: {kundePct}% af alle bosteder er kunder
          </p>
        </div>

        <div className="md-kort">
          <h3 className="md-kort-titel">Bearbejdningsstatus</h3>
          <div className="md-bearbejdning">
            <div className="md-bearbejdning-linje">
              <span className="md-bearbejdning-label">Kunder</span>
              <div className="md-bearbejdning-bar-track">
                <div className="md-bearbejdning-bar" style={{ width: `${kundePct}%`, background: '#22c55e' }} />
              </div>
              <span className="md-bearbejdning-tal">{kunder.toLocaleString('da-DK')}</span>
              <span className="md-bearbejdning-pct">({kundePct}%)</span>
            </div>
            <div className="md-bearbejdning-linje">
              <span className="md-bearbejdning-label">Kontaktet</span>
              <div className="md-bearbejdning-bar-track">
                <div className="md-bearbejdning-bar" style={{ width: `${bearbejdningsPct}%`, background: '#3b82f6' }} />
              </div>
              <span className="md-bearbejdning-tal">{kontaktet.toLocaleString('da-DK')}</span>
              <span className="md-bearbejdning-pct">({bearbejdningsPct}%)</span>
            </div>
            <div className="md-bearbejdning-linje">
              <span className="md-bearbejdning-label">Urørt</span>
              <div className="md-bearbejdning-bar-track">
                <div className="md-bearbejdning-bar" style={{ width: `${urørtPct}%`, background: '#e11d48' }} />
              </div>
              <span className="md-bearbejdning-tal">{urørt.toLocaleString('da-DK')}</span>
              <span className="md-bearbejdning-pct">({urørtPct}%)</span>
            </div>
          </div>
        </div>

        <div className="md-kort">
          <h3 className="md-kort-titel">Opmærksomhed</h3>
          <div className="md-opmærksomhed-liste">
            {stats.opmærksomhedssignaler.filter((s) => s.antal > 0).map((s) => (
              <div key={s.type} className="md-opmærksomhed-linje">
                <div className="md-opmærksomhed-tekst">
                  <span className="md-opmærksomhed-label">{s.label}</span>
                  <span className="md-opmærksomhed-beskrivelse">{s.beskrivelse}</span>
                </div>
                <span className="md-opmærksomhed-tal" style={{ color: s.antal > 50 ? '#dc2626' : '#d97706' }}>
                  {s.antal.toLocaleString('da-DK')}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
