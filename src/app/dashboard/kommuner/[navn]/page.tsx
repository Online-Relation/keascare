// src/app/dashboard/kommuner/[navn]/page.tsx

import { notFound } from 'next/navigation';
import { KommuneDetailPage } from '@/features/kommuner/components/KommuneDetailPage';
import { hentKommuneDetail, hentAlleKommuneNavne } from '@/features/kommuner/services/KommunerService';

export const revalidate = 86400;
export const dynamicParams = true;

type Props = {
  params: Promise<{ navn: string }>;
};

export async function generateStaticParams() {
  const navne = await hentAlleKommuneNavne();
  return navne.map((navn) => ({ navn: encodeURIComponent(navn) }));
}

export default async function KommuneDetailSide({ params }: Props) {
  const { navn } = await params;
  const kommuneNavn = decodeURIComponent(navn);
  const detail = await hentKommuneDetail(kommuneNavn);

  if (!detail) return notFound();

  return <KommuneDetailPage detail={detail} />;
}
