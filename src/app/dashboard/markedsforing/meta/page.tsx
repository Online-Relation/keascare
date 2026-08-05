// src/app/dashboard/markedsforing/meta/page.tsx
import { MetaPage } from '@/features/markedsforing/components/MetaPage';

type Props = { searchParams: Promise<{ fra?: string; til?: string }> };

export default async function MetaSide({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  return <MetaPage fra={fra} til={til} />;
}
