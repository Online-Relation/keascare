'use client';

// src/features/pakker/components/PakkerPage/PakkerPage.tsx

import type { ProdukterResultat } from '@/features/monday/services/MondayProdukterService';
import type { BeboerRegistrering } from '@/features/pakker/services/PakkerService';
import { BasispakkeTabel } from './sections/BasispakkeTabel/BasispakkeTabel';
import { MellempakkeTabel } from './sections/MellempakkeTabel/MellempakkeTabel';

type Props = {
  data: ProdukterResultat;
  mondayIdMap: Record<string, string>;
  registreringer: BeboerRegistrering[];
};

export function PakkerPage({ data, mondayIdMap, registreringer }: Props) {
  const basispakke = data.linjer.find((l) => l.produkt === 'Basispakke');
  const mellempakke = data.linjer.find((l) => l.produkt === 'FMK pakke');

  return (
    <div className="pakker-page">
      <div className="pakker-page-header">
        <h1 className="pakker-page-titel">Pakkeoverblik</h1>
        <p className="pakker-page-undertitel">Registrer beboere og se hvilke pakker kunderne er på</p>
      </div>

      {basispakke && basispakke.bosteder.length > 0 && (
        <BasispakkeTabel bosteder={basispakke.bosteder} />
      )}

      {mellempakke && mellempakke.bosteder.length > 0 && (
        <MellempakkeTabel
          bosteder={mellempakke.bosteder}
          mondayIdMap={mondayIdMap}
          eksisterendeRegistreringer={registreringer}
        />
      )}

    </div>
  );
}
