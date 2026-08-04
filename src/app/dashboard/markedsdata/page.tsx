// src/app/dashboard/markedsdata/page.tsx

import { MarkedsdataPage } from '@/features/markedsdata/components/MarkedsdataPage';
import { hentDstFraCache, hentDstKommuneData, hentDstÅrligeData } from '@/lib/api/DstClient';
import { hentMarkedsdataStats } from '@/features/markedsdata/services/MarkedsdataService';

export const revalidate = 0;

export default async function MarkedsdataSide() {
  const [cacheResultat, årligeData] = await Promise.all([
    hentDstFraCache(),
    hentDstÅrligeData(2016).catch(() => []),
  ]);

  let dstData = cacheResultat.data;
  const kvartal = cacheResultat.kvartal;

  if (!dstData.length) {
    dstData = await hentDstKommuneData();
  }

  const stats = await hentMarkedsdataStats(dstData);

  return (
    <MarkedsdataPage
      stats={stats}
      dstData={dstData}
      årligeData={årligeData}
      kvartal={kvartal}
    />
  );
}
