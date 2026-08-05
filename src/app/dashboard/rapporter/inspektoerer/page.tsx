// src/app/dashboard/rapporter/inspektoerer/page.tsx

import { Suspense } from 'react';
import { hentAlleInspektoerer } from '@/features/stps/services/StpsInspektoerService';
import { InspektoerSide } from '@/features/stps/components/InspektoerSide';

export const dynamic = 'force-dynamic';

export default async function InspektoererPage() {
  const inspektoerer = await hentAlleInspektoerer();
  return (
    <Suspense>
      <InspektoerSide inspektoerer={inspektoerer} />
    </Suspense>
  );
}
