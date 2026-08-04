// src/app/dashboard/bosteder/[id]/page.tsx

import { notFound } from 'next/navigation';
import { BostedDetailPage } from '@/features/dashboard/components/BostedDetailPage';
import { hentBostedById } from '@/features/dashboard/services/BostedService';
import { hentKundePakker } from '@/features/monday/services/MondayProdukterService';
import { erBostedVarslet } from '@/features/varsletTilsyn/services/VarsletTilsynService';
import { beregnSandsynligeInspektoerer } from '@/features/varsletTilsyn/services/VarsletTilsynService/sandsynlighedService';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BostedDetailRoute({ params }: PageProps) {
  const { id } = await params;
  const bosted = await hentBostedById(id);

  if (!bosted) notFound();

  const [pakker, varslingId] = await Promise.all([
    bosted.mondayItemId ? hentKundePakker(bosted.mondayItemId).catch(() => []) : Promise.resolve([]),
    erBostedVarslet(id),
  ]);

  const sandsynligeInspektoerer = varslingId
    ? await beregnSandsynligeInspektoerer(bosted.kommune ?? null)
    : [];

  return (
    <BostedDetailPage
      bosted={bosted}
      pakker={pakker}
      varslingId={varslingId}
      sandsynligeInspektoerer={sandsynligeInspektoerer}
    />
  );
}
