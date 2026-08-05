// src/app/dashboard/markedsforing/linkedin/page.tsx
import { LinkedinPage } from '@/features/markedsforing/components/LinkedinPage';

type Props = { searchParams: Promise<{ fra?: string; til?: string }> };

export default async function LinkedinSide({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  return <LinkedinPage fra={fra} til={til} />;
}
