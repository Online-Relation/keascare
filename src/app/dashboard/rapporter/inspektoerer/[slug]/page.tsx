// src/app/dashboard/rapporter/inspektoerer/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { hentAlleInspektoerer } from '@/features/stps/services/StpsInspektoerService';
import { InspektoerProfil } from '@/features/stps/components/InspektoerProfil';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export default async function InspektoerProfilPage({ params }: Props) {
  const { slug } = await params;
  const alle = await hentAlleInspektoerer();
  const ins  = alle.find((i) => i.slug === slug);
  if (!ins) notFound();
  return <InspektoerProfil inspektoer={ins} />;
}
