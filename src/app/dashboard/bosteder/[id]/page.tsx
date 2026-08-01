// src/app/dashboard/bosteder/[id]/page.tsx

import { notFound } from 'next/navigation';
import { BostedDetailPage } from '@/features/dashboard/components/BostedDetailPage';
import { hentBostedById } from '@/features/dashboard/services/BostedService';
import { hentKundePakker } from '@/features/monday/services/MondayProdukterService';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BostedDetailRoute({ params }: PageProps) {
  const { id } = await params;
  const bosted = await hentBostedById(id);

  if (!bosted) notFound();

  const pakker = bosted.mondayItemId
    ? await hentKundePakker(bosted.mondayItemId).catch(() => [])
    : [];

  return <BostedDetailPage bosted={bosted} pakker={pakker} />;
}
