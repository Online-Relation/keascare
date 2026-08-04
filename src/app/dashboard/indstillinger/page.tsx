// src/app/dashboard/indstillinger/page.tsx

import { getVisFilter, getLosFilter } from '@/lib/config/GlobalFilter';
import { IndstillingerPage } from '@/features/indstillinger/components/IndstillingerPage';

export default async function IndstillingerSide() {
  const [filter, losFilter] = await Promise.all([getVisFilter(), getLosFilter()]);
  return <IndstillingerPage aktivtFilter={filter} losFilter={losFilter} />;
}
