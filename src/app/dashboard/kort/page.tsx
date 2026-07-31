// src/app/dashboard/kort/page.tsx

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { KortPage } from '@/features/kort/components/KortPage';
import type { KortPin } from '@/features/kort/components/DanmarksKort';

export const dynamic = 'force-dynamic';

export default async function KortServerPage() {
  const supabase = getSupabaseServerClient();

  const { data } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, lat, lng, fund_niveau, kommune, monday_item_id')
    .not('lat', 'is', null)
    .neq('lat', 0);

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
