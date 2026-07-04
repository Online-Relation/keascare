// src/app/dashboard/markedsdata/page.tsx

import { MarkedsdataPage } from '@/features/markedsdata/components/MarkedsdataPage';
import { hentDstKommuneData } from '@/lib/api/DstClient';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

export const revalidate = 0;

export default async function MarkedsdataSide() {
  const supabase = getSupabaseServerClient();

  const [dstData, tpTæl] = await Promise.all([
    hentDstKommuneData(),
    supabase.from('tilbudsportalen_tilbud').select('*', { count: 'exact', head: true }),
  ]);

  const antalBosteder = tpTæl.count ?? 0;

  return <MarkedsdataPage data={dstData} antalBosteder={antalBosteder} />;
}
