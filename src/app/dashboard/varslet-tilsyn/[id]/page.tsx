// src/app/dashboard/varslet-tilsyn/[id]/page.tsx

import { notFound } from 'next/navigation';
import { hentVarsling } from '@/features/varsletTilsyn/services/VarsletTilsynService';
import { beregnSandsynligeInspektoerer } from '@/features/varsletTilsyn/services/VarsletTilsynService/sandsynlighedService';
import { VarsletTilsynDetalje } from '@/features/varsletTilsyn/components/VarsletTilsynDetalje';

type PageProps = { params: Promise<{ id: string }> };

export default async function VarsletTilsynDetaljeRoute({ params }: PageProps) {
  const { id } = await params;
  const varsling = await hentVarsling(id);
  if (!varsling) notFound();

  const sandsynligeInspektoerer = await beregnSandsynligeInspektoerer(varsling.kommune);

  return <VarsletTilsynDetalje varsling={varsling} sandsynligeInspektoerer={sandsynligeInspektoerer} />;
}
