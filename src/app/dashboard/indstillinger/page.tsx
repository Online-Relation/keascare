// src/app/dashboard/indstillinger/page.tsx

import { getVisFilter, getLosFilter, getParagraf43Filter } from '@/lib/config/GlobalFilter';
import { IndstillingerPage } from '@/features/indstillinger/components/IndstillingerPage';

export default async function IndstillingerSide() {
  const [filter, losFilter, paragraf43Filter] = await Promise.all([
    getVisFilter(),
    getLosFilter(),
    getParagraf43Filter(),
  ]);
  return <IndstillingerPage aktivtFilter={filter} losFilter={losFilter} paragraf43Filter={paragraf43Filter} />;
}
