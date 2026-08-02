// src/app/dashboard/rapporter/inspektoerer/page.tsx

import { hentAlleInspektoerer } from '@/features/stps/services/StpsInspektoerService';
import { InspektoerSide } from '@/features/stps/components/InspektoerSide';

export const dynamic = 'force-dynamic';

export default async function InspektoererPage() {
  const inspektoerer = await hentAlleInspektoerer();
  return <InspektoerSide inspektoerer={inspektoerer} />;
}
