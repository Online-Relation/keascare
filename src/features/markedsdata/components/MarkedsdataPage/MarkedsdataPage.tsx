// src/features/markedsdata/components/MarkedsdataPage/MarkedsdataPage.tsx

import { MarkedsdataNavigering } from './sections/MarkedsdataNavigering';
import { MarkedsdataMulighederne } from './sections/MarkedsdataMulighederne';
import { MarkedsdataPrioritering } from './sections/MarkedsdataPrioritering';
import { MarkedsdataSalgsarbejdet } from './sections/MarkedsdataSalgsarbejdet';
import { MarkedsdataAI } from './sections/MarkedsdataAI';
import type { MarkedsdataStats } from '@/features/markedsdata/types/markedsdata.types';
import type { AiAnalyse } from '@/features/markedsdata/services/AiAnalyseService';
import type { DstKommuneRå, DstÅrTotal } from '@/lib/api/DstClient';

type Props = {
  stats: MarkedsdataStats;
  dstData: DstKommuneRå[];
  årligeData: DstÅrTotal[];
  kvartal: string | null;
  aiAnalyse: AiAnalyse | null;
};

export function MarkedsdataPage({ stats, dstData, årligeData, kvartal, aiAnalyse }: Props) {
  return (
    <div className="dashboard-content">
      <MarkedsdataNavigering />
      <MarkedsdataMulighederne stats={stats} dstData={dstData} årligeData={årligeData} kvartal={kvartal} />
      <MarkedsdataPrioritering bosteder={stats.bosteder} kommuner={stats.kommuner} />
      <MarkedsdataSalgsarbejdet stats={stats} />
      <MarkedsdataAI analyse={aiAnalyse} />
    </div>
  );
}
