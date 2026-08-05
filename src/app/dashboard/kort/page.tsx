// src/app/dashboard/kort/page.tsx

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { KortPage } from '@/features/kort/components/KortPage';
import type { KortPin } from '@/features/kort/components/DanmarksKort';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ fra?: string; til?: string }>;
};

export default async function KortServerPage({ searchParams }: Props) {
  const { fra, til } = await searchParams;
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, lat, lng, fund_niveau, kommune, monday_item_id, rapport_dato')
    .not('lat', 'is', null)
    .neq('lat', 0);

  if (fra) query = query.gte('rapport_dato', fra);
  if (til) query = query.lte('rapport_dato', til);

  const { data } = await query;

  const pins: KortPin[] = (data ?? []).map((r) => ({
    id: r.id,
    navn: r.stps_tilbud_navn,
    lat: r.lat,
    lng: r.lng,
    fundNiveau: r.fund_niveau,
    kommune: r.kommune,
    erKunde: !!r.monday_item_id,
  }));

  return <KortPage allePins={pins} />;
}
