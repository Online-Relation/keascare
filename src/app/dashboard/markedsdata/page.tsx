// src/app/dashboard/markedsdata/page.tsx

import { MarkedsdataPage } from '@/features/markedsdata/components/MarkedsdataPage';
import { hentDstKommuneData } from '@/lib/api/DstClient';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { getVisFilter, KOMMUNALE_DRIFTSFORMER } from '@/lib/config/GlobalFilter';

export const revalidate = 0;

export default async function MarkedsdataSide() {
  const supabase = getSupabaseServerClient();
  const visFilter = await getVisFilter();

  let tpQuery = supabase.from('tilbudsportalen_tilbud').select('*', { count: 'exact', head: true });
  if (visFilter === 'privat') {
    tpQuery = tpQuery.not('driftsform', 'in', `(${KOMMUNALE_DRIFTSFORMER.map((d) => `"${d}"`).join(',')})`);
  }

  const [dstData, tpTæl] = await Promise.all([
    hentDstKommuneData(),
    tpQuery,
  ]);

  const antalBosteder = tpTæl.count ?? 0;

  return <MarkedsdataPage data={dstData} antalBosteder={antalBosteder} />;
}
