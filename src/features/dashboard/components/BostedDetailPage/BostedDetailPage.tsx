// src/features/dashboard/components/BostedDetailPage/BostedDetailPage.tsx

import type { BostedDetail } from '@/features/dashboard/types/dashboard.types';
import { BostedHeader } from './sections/BostedHeader';
import { BostedFundsoversigt } from './sections/BostedFundsoversigt';
import { BostedTilsynKort } from './sections/BostedTilsynKort';
import { BostedOrganisationKort } from './sections/BostedOrganisationKort';
import { BostedHandlinger } from './sections/BostedHandlinger';

type BostedDetailPageProps = {
  bosted: BostedDetail;
};

export function BostedDetailPage({ bosted }: BostedDetailPageProps) {
  return (
    <div className="bosted-detail-layout">
      <BostedHeader bosted={bosted} />

      <BostedFundsoversigt bosted={bosted} />

      <div className="bosted-detail-grid">
        <BostedTilsynKort bosted={bosted} />
        <BostedOrganisationKort bosted={bosted} />
      </div>

      <BostedHandlinger />
    </div>
  );
}
