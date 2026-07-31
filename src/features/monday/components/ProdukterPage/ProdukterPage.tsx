// src/features/monday/components/ProdukterPage/ProdukterPage.tsx

import type { ProdukterResultat } from '@/features/monday/services/MondayProdukterService';
import { ProduktKort } from './sections/ProduktKort';
import { ProduktTabel } from './sections/ProduktTabel';

type Props = {
  data: ProdukterResultat;
};

export function ProdukterPage({ data }: Props) {
  const max = data.linjer[0]?.antal ?? 1;

  return (
    <div className="produkter-layout">
      <div className="produkter-header">
        <h1 className="produkter-titel">Produkter</h1>
        <p className="produkter-subtitle">
          {data.totalBosteder} kunder i Monday · Hentet på {data.hentetMs} ms
        </p>
      </div>

      <div className="produkt-kort-grid">
        {data.linjer.map((linje) => (
          <ProduktKort key={linje.produkt} linje={linje} max={max} />
        ))}
      </div>

      <ProduktTabel linjer={data.linjer} />
    </div>
  );
}
