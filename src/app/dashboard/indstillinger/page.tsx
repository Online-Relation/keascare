// src/app/dashboard/indstillinger/page.tsx

import { getVisFilter } from '@/lib/config/GlobalFilter';
import { IndstillingerPage } from '@/features/indstillinger/components/IndstillingerPage';

export default async function IndstillingerSide() {
  const filter = await getVisFilter();
  return <IndstillingerPage aktivtFilter={filter} />;
}
