'use client';

// src/features/dashboard/components/BostedDetailPage/sections/BostedVarsletTilsynBoks/BostedVarsletTilsynBoks.tsx

import Link from 'next/link';
import { Bell, ExternalLink, Users, Lightbulb } from 'lucide-react';
import { InspektoerAvatar } from '@/features/stps/components/InspektoerSide/InspektoerAvatar';
import type { SandsynligInspektoer } from '@/features/varsletTilsyn/types/varsletTilsyn.types';

type Props = {
  varslingId: string;
  bostedNavn: string;
  kommune: string | null;
  sandsynligeInspektoerer: SandsynligInspektoer[];
};

export function BostedVarsletTilsynBoks({ varslingId, bostedNavn, kommune, sandsynligeInspektoerer }: Props) {
  // Saml unikke fokusområder fra alle sandsynlige inspektører
  const fællesFokus = [
    ...new Set(
      sandsynligeInspektoerer.flatMap((ins) => ins.typiskeFokus ?? [])
    ),
  ].slice(0, 5);

  return (
    <div className="bosted-detail-kort varslet-boks">
      <div className="bosted-detail-kort-header varslet-boks-header">
        <Bell size={15} className="varslet-boks-ikon" />
        <span className="bosted-detail-kort-titel">Varslet tilsyn — forberedelse</span>
        <Link
          href={`/dashboard/varslet-tilsyn/${varslingId}`}
          className="varslet-boks-fuld-link"
          title="Åbn fuld forberedelses-side"
        >
          <ExternalLink size={13} />
          Fuld side
        </Link>
      </div>

      <div className="bosted-detail-kort-body varslet-boks-body">

        {/* Sandsynlige inspektører */}
        <div className="varslet-boks-sektion">
          <p className="varslet-boks-sektion-titel">
            <Users size={13} />
            Sandsynlige inspektører
          </p>
          {sandsynligeInspektoerer.length === 0 ? (
            <p className="varslet-boks-tom">Ingen historik for tilsyn i {kommune ?? 'denne kommune'} endnu.</p>
          ) : (
            <div className="varslet-boks-insp-liste">
              {sandsynligeInspektoerer.map((ins) => (
                <Link
                  key={ins.slug}
                  href={`/dashboard/rapporter/inspektoerer/${ins.slug}`}
                  className="varslet-boks-insp-række"
                >
                  <InspektoerAvatar slug={ins.slug} navn={ins.navn} size={30} />
                  <div className="varslet-boks-insp-tekst">
                    <span className="varslet-boks-insp-navn">{ins.navn}</span>
                    {ins.titel && <span className="varslet-boks-insp-titel">{ins.titel}</span>}
                  </div>
                  <span className="varslet-boks-insp-antal">{ins.antalIKommune}×</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Typiske fokusområder */}
        {fællesFokus.length > 0 && (
          <div className="varslet-boks-sektion">
            <p className="varslet-boks-sektion-titel">
              <Lightbulb size={13} />
              Typiske fokusområder
            </p>
            <div className="varslet-boks-fokus-liste">
              {fællesFokus.map((f) => (
                <span key={f} className="varslet-boks-fokus-tag">{f}</span>
              ))}
            </div>
          </div>
        )}


</div>
    </div>
  );
}
