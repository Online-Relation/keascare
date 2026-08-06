// src/app/dashboard/markedsdata/page.tsx

import { MarkedsdataPage } from '@/features/markedsdata/components/MarkedsdataPage';
import { hentDstFraCache, hentDstKommuneData, hentDstÅrligeData } from '@/lib/api/DstClient';
import { hentMarkedsdataStats } from '@/features/markedsdata/services/MarkedsdataService';
import { hentSenesteAiAnalyse } from '@/features/markedsdata/services/AiAnalyseService';
import { getLosFilter, getVisFilter, getParagraf43Filter } from '@/lib/config/GlobalFilter';

export const revalidate = 0;

export default async function MarkedsdataSide() {
  const [cacheResultat, årligeData, aiAnalyse, losFilter, visFilter, paragraf43Filter] = await Promise.all([
    hentDstFraCache(),
    hentDstÅrligeData(2016).catch(() => []),
    hentSenesteAiAnalyse('markedsdata').catch(() => null),
    getLosFilter(),
    getVisFilter(),
    getParagraf43Filter(),
  ]);

  let dstData = cacheResultat.data;
  const kvartal = cacheResultat.kvartal;

  if (!dstData.length) {
    dstData = await hentDstKommuneData();
  }

  const stats = await hentMarkedsdataStats(dstData, losFilter, visFilter, paragraf43Filter);

  return (
    <MarkedsdataPage
      stats={stats}
      dstData={dstData}
      årligeData={årligeData}
      kvartal={kvartal}
      aiAnalyse={aiAnalyse}
    />
  );
}
