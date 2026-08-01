// src/app/dashboard/sor/page.tsx

import { SorPage } from '@/features/sor/components/SorPage';
import { hentSorCache, hentSorSidstSynkroniseret, hentUmatchedeSorEnheder } from '@/features/sor/services/SorService';
import { hentAlleMondayKunder } from '@/features/monday/services/MondayKunderService';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

const hentKunderCached = unstable_cache(hentAlleMondayKunder, ['monday-kunder-sor'], { revalidate: 300 });

export default async function SorSide() {
  const [sorEnheder, kunder, sidstSynk] = await Promise.all([
    hentSorCache().catch(() => []),
    hentKunderCached().catch(() => []),
    hentSorSidstSynkroniseret().catch(() => null),
  ]);

  const mondayNavne = kunder.map((k) => k.navn);
  const mondayCvr = kunder.map((k) => k.cvr);

  const nyeLeads = hentUmatchedeSorEnheder(sorEnheder, mondayNavne, mondayCvr);

  return (
    <SorPage
      nyeLeads={nyeLeads}
      antalIAlt={sorEnheder.length}
      sidstSynkroniseret={sidstSynk}
    />
  );
}
