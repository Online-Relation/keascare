// src/app/dashboard/sor/page.tsx

import { SorPage } from '@/features/sor/components/SorPage';
import {
  hentSorCache,
  hentSorSidstSynkroniseret,
  hentUmatchedeSorEnheder,
  hentKendteBostederCvr,
  udtrækEnhedstyper,
} from '@/features/sor/services/SorService';

export const dynamic = 'force-dynamic';

export default async function SorSide() {
  const [sorEnheder, kendteCvr, sidstSynk] = await Promise.all([
    hentSorCache().catch(() => []),
    hentKendteBostederCvr().catch(() => []),
    hentSorSidstSynkroniseret().catch(() => null),
  ]);

  const nyeLeads = hentUmatchedeSorEnheder(sorEnheder, kendteCvr);
  const enhedstyper = udtrækEnhedstyper(sorEnheder);

  return (
    <SorPage
      nyeLeads={nyeLeads}
      antalIAlt={sorEnheder.length}
      antalKendte={sorEnheder.length - nyeLeads.length}
      sidstSynkroniseret={sidstSynk}
      enhedstyper={enhedstyper}
    />
  );
}
