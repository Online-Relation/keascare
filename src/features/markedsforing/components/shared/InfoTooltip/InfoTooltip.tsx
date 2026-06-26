// src/features/markedsforing/components/shared/InfoTooltip/InfoTooltip.tsx

import { Info } from 'lucide-react';

type Props = {
  tekst: string;
};

export function InfoTooltip({ tekst }: Props) {
  return (
    <span className="info-tooltip-wrap">
      <Info size={13} className="info-tooltip-ikon" />
      <span className="info-tooltip-boble">{tekst}</span>
    </span>
  );
}
