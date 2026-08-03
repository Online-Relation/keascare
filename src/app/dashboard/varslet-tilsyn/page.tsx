// src/app/dashboard/varslet-tilsyn/page.tsx

import { hentAlleVarslinger } from '@/features/varsletTilsyn/services/VarsletTilsynService';
import { VarsletTilsynPage } from '@/features/varsletTilsyn/components/VarsletTilsynPage';

export default async function VarsletTilsynRoute() {
  const varslinger = await hentAlleVarslinger();
  return <VarsletTilsynPage varslinger={varslinger} />;
}
