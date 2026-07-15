// src/app/dashboard/markedsdata/page.tsx

import { MarkedsdataPage } from '@/features/markedsdata/components/MarkedsdataPage';
import { hentDstFraCache, hentDstKommuneData, hentDstÅrligeData } from '@/lib/api/DstClient';
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

  // Forsøg at læse fra Supabase-cache — fald tilbage til live DST-kald hvis tom
  const [cacheResultat, tpTæl, årligeData] = await Promise.all([
    hentDstFraCache(),
    tpQuery,
    hentDstÅrligeData(2016).catch(() => []),
  ]);

  let dstData = cacheResultat.data;
  let kvartal = cacheResultat.kvartal;
  let hentetKl = cacheResultat.hentetKl;

  if (!dstData.length) {
    // Cache er tom — hent live fra DST (første gang)
    dstData = await hentDstKommuneData();
    kvartal = dstData[0]?.kvartal ?? null;
    hentetKl = null;
  }

  const antalBosteder = tpTæl.count ?? 0;

  return (
    <MarkedsdataPage
      data={dstData}
      antalBosteder={antalBosteder}
      kvartal={kvartal}
      hentetKl={hentetKl}
      visFilter={visFilter}
      årligeData={årligeData}
    />
  );
}
