// src/features/markedsdata/components/MarkedsdataPage/sections/MarkedsdataAI/MarkedsdataAI.tsx

import { Sparkles } from 'lucide-react';
import type { MarkedsdataStats } from '@/features/markedsdata/types/markedsdata.types';

type Props = { stats: MarkedsdataStats };

export function MarkedsdataAI({ stats }: Props) {
  const topKommuner = stats.kommuner
    .sort((a, b) => b.borgere - a.borgere)
    .slice(0, 3)
    .map((k) => k.kommune)
    .join(', ');

  const urørtPct = stats.totalBosteder > 0
    ? Math.round((stats.antalAldrigKontaktet / stats.totalBosteder) * 100)
    : 0;

  return (
    <div className="md-ai-kort">
      <div className="md-ai-header">
        <Sparkles size={16} />
        <span className="md-ai-label">AI-overblik</span>
        <span className="md-ai-badge">Kommer snart</span>
      </div>
      <p className="md-ai-tekst">
        {topKommuner && (
          <>
            Kommuner som {topKommuner} har flest borgere i §107/§108 botilbud og er naturlige prioriteter for salgsarbejdet.{' '}
          </>
        )}
        {stats.antalKritiskeEllerStoerre > 0 && (
          <>
            {stats.antalKritiskeEllerStoerre.toLocaleString('da-DK')} bosteder har kritiske eller større STPS-fund — disse bosteder har typisk størst behov for ekstern tilsynshjælp og bør kontaktes hurtigt.{' '}
          </>
        )}
        {urørtPct > 50 && (
          <>
            {urørtPct}% af markedet er endnu ikke kontaktet — der er betydeligt potentiale i systematisk outreach til disse bosteder.{' '}
          </>
        )}
        En dybere AI-analyse med kommunesammenligninger og salgspotentiale-scoring er planlagt til næste version.
      </p>
      <p className="md-ai-note">
        Data fra Tilbudsportalen, STPS og Danmarks Statistik · Opdateres dagligt
      </p>
    </div>
  );
}
