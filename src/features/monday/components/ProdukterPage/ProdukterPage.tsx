// src/features/monday/components/ProdukterPage/ProdukterPage.tsx

import type { ProdukterResultat } from '@/features/monday/services/MondayProdukterService';
import { ProduktKort } from './sections/ProduktKort';
import { RevenueDonut } from './sections/RevenueDonut/RevenueDonut';
import { OmsætningChart } from './sections/OmsætningChart/OmsætningChart';

type Props = { data: ProdukterResultat };

function fmt(tal: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency', currency: 'DKK', maximumFractionDigits: 0,
  }).format(tal);
}

export function ProdukterPage({ data }: Props) {
  const max = data.linjer[0]?.antal ?? 1;
  const årsligMrr = data.totalMrr * 12;
  const totalPortefølje = data.totalEngangsomsætning + årsligMrr;

  return (
    <div className="produkter-layout">

      {/* ── Hero ── */}
      <div className="produkter-hero">
        <div className="produkter-hero-indhold">
          <div className="produkter-hero-venstre">
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
                <div className="hero-kpi-værdi">{fmt(data.totalEngangsomsætning)}</div>
                <div className="hero-kpi-sub">Kurser &amp; ydelser</div>
              </div>
              <div className="hero-kpi hero-kpi-accent">
                <div className="hero-kpi-label">Månedlig MRR</div>
                <div className="hero-kpi-værdi">{fmt(data.totalMrr)}</div>
                <div className="hero-kpi-sub">Basispakke-abonnementer</div>
              </div>
              <div className="hero-kpi">
                <div className="hero-kpi-label">Årslig MRR</div>
                <div className="hero-kpi-værdi">{fmt(årsligMrr)}</div>
                <div className="hero-kpi-sub">× 12 måneder</div>
              </div>
              <div className="hero-kpi hero-kpi-guld">
                <div className="hero-kpi-label">Total portefølje</div>
                <div className="hero-kpi-værdi">{fmt(totalPortefølje)}</div>
                <div className="hero-kpi-sub">Engangs + årslig MRR</div>
              </div>
            </div>
          </div>

          {/* Donut */}
          <div className="produkter-hero-donut">
            <RevenueDonut mrr={data.totalMrr} engangs={data.totalEngangsomsætning} />
          </div>
        </div>
      </div>

      {/* ── Omsætningschart ── */}
      <OmsætningChart linjer={data.linjer} />

      {/* ── Produkt-kort ── */}
      <div>
        <h2 className="sektion-titel">Produkter</h2>
        <div className="produkt-kort-grid">
          {data.linjer.map((linje) => (
            <ProduktKort key={linje.produkt} linje={linje} max={max} />
          ))}
        </div>
      </div>

    </div>
  );
}
