// src/app/dashboard/pakker/page.tsx

import { unstable_cache } from 'next/cache';
import { hentProduktStatistik } from '@/features/monday/services/MondayProdukterService';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { PakkerPage } from '@/features/pakker/components/PakkerPage';
import type { BeboerRegistrering } from '@/features/pakker/services/PakkerService';

export const dynamic = 'force-dynamic';

// Monday data caches i 5 minutter — Supabase-data hentes frisk ved hvert besøg
const hentProduktStatistikCached = unstable_cache(
  hentProduktStatistik,
  ['produkt-statistik'],
  { revalidate: 300 },
);

export default async function PakkerRoute() {
  const supabase = getSupabaseServerClient();

  const [data, registreringerRaw, kundeRaw] = await Promise.all([
    hentProduktStatistikCached(),
    supabase
      .from('pakke_beboer_registreringer')
      .select('*')
      .order('aar', { ascending: false })
      .order('maaned', { ascending: false })
      .then(({ data }) => data ?? []),
    supabase
      .from('monday_kunder')
      .select('monday_id, navn')
      .then(({ data }) => data ?? []),
  ]);

  const registreringer: BeboerRegistrering[] = registreringerRaw.map((r) => ({
    id: r.id,
    mondayItemId: r.monday_item_id,
    bostedNavn: r.bosted_navn,
    pakke: r.pakke,
    aar: r.aar,
    maaned: r.maaned,
    antalBeboere: r.antal_beboere,
    opdateret: r.opdateret ?? null,
  }));

  const mondayIdMap: Record<string, string> = {};
  for (const k of kundeRaw) {
    if (k.navn && k.monday_id) mondayIdMap[k.navn] = k.monday_id;
  }

  return <PakkerPage data={data} mondayIdMap={mondayIdMap} registreringer={registreringer} />;
}
