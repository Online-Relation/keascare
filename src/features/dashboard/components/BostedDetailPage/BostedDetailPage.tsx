// src/features/dashboard/components/BostedDetailPage/BostedDetailPage.tsx

import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';
import { BostedHeader } from './sections/BostedHeader';
import { BostedFundsoversigt } from './sections/BostedFundsoversigt';
import { BostedTilsynKort } from './sections/BostedTilsynKort';
import { BostedOrganisationKort } from './sections/BostedOrganisationKort';
import { BostedHandlinger } from './sections/BostedHandlinger';
import { BostedSalgsAfsnit } from './sections/BostedSalgsAfsnit';
import { MailchimpSignup } from './sections/MailchimpSignup';

type BostedDetailPageProps = {
  bosted: BostedDetail;
};

export function BostedDetailPage({ bosted }: BostedDetailPageProps) {
  return (
    <div className="bosted-detail-layout">
      <BostedHeader bosted={bosted} />

      <div className="bosted-detail-grid">
        <BostedTilsynKort bosted={bosted} />
        <BostedOrganisationKort bosted={bosted} />
      </div>

      {bosted.fundNiveau !== 'ingen' && bosted.fundNiveau !== 'ukendt' && (
        <BostedSalgsAfsnit bostedId={bosted.id} cachetAnbefalinger={bosted.salgsAnbefalinger} />
      )}

      <BostedFundsoversigt bosted={bosted} />

      <MailchimpSignup bostedNavn={bosted.navn} foreslåetEmail={bosted.tpEmail ?? undefined} />

      <BostedHandlinger />
    </div>
  );
}
