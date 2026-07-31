// src/features/monday/components/ProdukterPage/ProdukterPage.tsx

import type { ProdukterResultat } from '@/features/monday/services/MondayProdukterService';
import { ProduktKort } from './sections/ProduktKort';

type Props = { data: ProdukterResultat };

function formaterKr(tal: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(tal);
}

export function ProdukterPage({ data }: Props) {
  const max = data.linjer[0]?.antal ?? 1;
  const totalOmsætning = data.totalEngangsomsætning + data.totalMrr;
  const årsligMrr = data.totalMrr * 12;

  return (
    <div className="produkter-layout">

      {/* Hero */}
      <div className="produkter-hero">
        <div className="produkter-hero-top">
          <div>
            <h1 className="produkter-hero-titel">Produktportefølje</h1>
            <p className="produkter-hero-subtitle">
              {data.totalBosteder} aktive kunder · {data.linjer.length} produkter
            </p>
          </div>
          <span className="produkter-hero-badge">Live fra Monday</span>
        </div>

        <div className="produkter-hero-kpier">
          <div className="hero-kpi">
            <div className="hero-kpi-label">Engangsomsætning</div>
            <div className="hero-kpi-værdi">{formaterKr(data.totalEngangsomsætning)}</div>
            <div className="hero-kpi-sub">Samlet salg af kurser & ydelser</div>
          </div>
          <div className="hero-kpi hero-kpi-accent">
            <div className="hero-kpi-label">Månedlig MRR</div>
            <div className="hero-kpi-værdi">{formaterKr(data.totalMrr)}</div>
            <div className="hero-kpi-sub">Basispakke-abonnementer</div>
          </div>
          <div className="hero-kpi">
            <div className="hero-kpi-label">Årslig MRR</div>
            <div className="hero-kpi-værdi">{formaterKr(årsligMrr)}</div>
            <div className="hero-kpi-sub">Basispakke × 12 måneder</div>
          </div>
          <div className="hero-kpi">
            <div className="hero-kpi-label">Total portefølje</div>
            <div className="hero-kpi-værdi">{formaterKr(totalOmsætning + årsligMrr)}</div>
            <div className="hero-kpi-sub">Engangspris + årslig MRR</div>
          </div>
        </div>
      </div>

      {/* Produkt-kort */}
      <div className="produkt-kort-grid">
        {data.linjer.map((linje) => (
          <ProduktKort key={linje.produkt} linje={linje} max={max} />
        ))}
      </div>

    </div>
  );
}
