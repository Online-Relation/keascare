// src/features/stps/components/InspektoerProfil/sections/ProfilKolleger/ProfilKolleger.tsx

import Link from 'next/link';
import { InspektoerAvatar } from '@/features/stps/components/InspektoerSide/InspektoerAvatar';
import type { InspektoerFuldStat } from '@/features/stps/types/inspektoer.types';

type Props = { inspektoer: InspektoerFuldStat };

export function ProfilKolleger({ inspektoer }: Props) {
  if (inspektoer.kolleger.length === 0) return null;

  return (
    <div className="profil-sektion">
      <h2 className="profil-sektion-titel">Hyppige tilsynspartnere</h2>
      <p className="profil-kolleger-beskrivelse">
        Inspektører der oftest er ude på tilsyn samme dag som {inspektoer.navn.split(' ')[0]}.
      </p>
      <div className="profil-kolleger-liste">
        {inspektoer.kolleger.map((k) => (
          <Link
            key={k.slug}
            href={`/dashboard/rapporter/inspektoerer/${k.slug}`}
            className="profil-kollega-kort"
          >
            <InspektoerAvatar slug={k.slug} navn={k.navn} size={40} />
            <div className="profil-kollega-tekst">
              <span className="profil-kollega-navn">{k.navn}</span>
              {k.titel && <span className="profil-kollega-titel">{k.titel}</span>}
            </div>
            <span className="profil-kollega-antal">{k.antalSammen}×</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
