// src/app/dashboard/markedsdata/page.tsx

import { MarkedsdataPage } from '@/features/markedsdata/components/MarkedsdataPage';
import { hentDstKommuneData } from '@/lib/api/DstClient';

export const revalidate = 86400;

export default async function MarkedsdataSide() {
  const data = await hentDstKommuneData();
  return <MarkedsdataPage data={data} />;
}
