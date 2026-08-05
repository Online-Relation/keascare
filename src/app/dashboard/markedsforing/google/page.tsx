// src/app/dashboard/markedsforing/google/page.tsx
import { GoogleAdsPage } from '@/features/markedsforing/components/GoogleAdsPage';

type Props = { searchParams: Promise<{ fra?: string; til?: string }> };

export default async function GoogleSide({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  return <GoogleAdsPage fra={fra} til={til} />;
}
