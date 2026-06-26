// src/features/markedsforing/components/shared/MetrikKort/MetrikKort.tsx

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { InfoTooltip } from '../InfoTooltip';
import type { MetrikKortData } from '@/features/markedsforing/types/markedsforing.types';

type Props = {
  data: MetrikKortData;
};

export function MetrikKort({ data }: Props) {
  const TendensIkon =
    data.tendens === 'op' ? TrendingUp : data.tendens === 'ned' ? TrendingDown : Minus;

  return (
    <div className="mk-kort">
      <div className="mk-kort-top">
        <span className="mk-kort-label">{data.label}</span>
        <InfoTooltip tekst={data.forklaring} />
      </div>
      <div className="mk-kort-tal">{data.værdi}</div>
      {data.underværdi && <div className="mk-kort-underværdi">{data.underværdi}</div>}
      <div className={`mk-kort-tendens mk-tendens-${data.tendens}`}>
        <TendensIkon size={13} />
        <span>{data.tendensProc} ift. forrige mdr.</span>
      </div>
    </div>
  );
}
