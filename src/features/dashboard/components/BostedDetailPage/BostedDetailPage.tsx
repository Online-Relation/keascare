// src/features/dashboard/components/BostedDetailPage/BostedDetailPage.tsx

'use client';

import { useState } from 'react';
import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';
import { BostedHeader } from './sections/BostedHeader';
import { BostedFundsoversigt } from './sections/BostedFundsoversigt';
import { BostedTilsynKort } from './sections/BostedTilsynKort';
import { BostedOrganisationKort } from './sections/BostedOrganisationKort';
import { BostedHandlinger } from './sections/BostedHandlinger';
import { BostedSalgsAfsnit } from './sections/BostedSalgsAfsnit';
import { MailchimpSignup } from './sections/MailchimpSignup';
import { KontaktHistorik } from './sections/KontaktHistorik';
import { BostedKort } from './sections/BostedKort';
import { TidligereRapporter } from './sections/TidligereRapporter';

type BostedDetailPageProps = {
  bosted: BostedDetail;
};

export function BostedDetailPage({ bosted }: BostedDetailPageProps) {
  const [historikOpdater, setHistorikOpdater] = useState(0);

  return (
    <div className="bosted-detail-layout">
      <BostedHeader bosted={bosted} />

      <div className="bosted-detail-grid">
        <BostedTilsynKort bosted={bosted} />
        <BostedOrganisationKort bosted={bosted} />
      </div>

      {(bosted.tpAdresse ?? bosted.adresse) && (
        <div style={{ marginTop: '1.25rem' }}>
          <BostedKort adresse={(bosted.tpAdresse ?? bosted.adresse)!} />
        </div>
      )}


      {bosted.fundNiveau !== 'ingen' && bosted.fundNiveau !== 'ukendt' && (
        <BostedSalgsAfsnit bostedId={bosted.id} cachetAnbefalinger={bosted.salgsAnbefalinger} />
      )}

      {bosted.cvr && (
        <TidligereRapporter bostedId={bosted.id} cvr={bosted.cvr} />
      )}

      <BostedFundsoversigt bosted={bosted} />

      <MailchimpSignup bostedNavn={bosted.navn} foreslåetEmail={bosted.tpEmail ?? undefined} />

      <BostedHandlinger
        bostedId={bosted.id}
        mondayItemId={bosted.mondayItemId}
        onLogget={() => setHistorikOpdater((n) => n + 1)}
      />

      <KontaktHistorik bostedId={bosted.id} opdater={historikOpdater} />
    </div>
  );
}
