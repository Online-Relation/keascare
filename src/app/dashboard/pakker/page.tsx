// src/app/dashboard/pakker/page.tsx

import { unstable_cache } from 'next/cache';
import { hentProduktStatistik } from '@/features/monday/services/MondayProdukterService';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import { PakkerPage } from '@/features/pakker/components/PakkerPage';
import type { BeboerRegistrering, StorPrisRegistrering } from '@/features/pakker/services/PakkerService';
import { hentSorCache, bygSorMatchMap } from '@/features/sor/services/SorService';

export const dynamic = 'force-dynamic';

const hentProduktStatistikCached = unstable_cache(
  hentProduktStatistik,
  ['produkt-statistik'],
  { revalidate: 300 },
);

export default async function PakkerRoute() {
  const supabase = getSupabaseServerClient();

  const [data, registreringerRaw, storPriserRaw, kundeRaw, sorEnheder] = await Promise.all([
    hentProduktStatistikCached(),
    supabase
      .from('pakke_beboer_registreringer')
      .select('*')
      .order('aar', { ascending: false })
      .order('maaned', { ascending: false })
      .then(({ data }) => data ?? []),
    supabase
      .from('pakke_stor_pris')
      .select('*')
      .order('aar', { ascending: false })
      .order('maaned', { ascending: false })
      .then(({ data }) => data ?? []),
    supabase
      .from('monday_kunder')
      .select('monday_id, navn')
      .then(({ data }) => data ?? []),
    hentSorCache().catch(() => []),
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

  const storPriser: StorPrisRegistrering[] = storPriserRaw.map((r) => ({
    id: r.id,
    mondayItemId: r.monday_item_id,
    bostedNavn: r.bosted_navn,
    aar: r.aar,
    maaned: r.maaned,
    maanedligPris: Number(r.maanedlig_pris),
    opdateret: r.opdateret ?? null,
  }));

  const mondayIdMap: Record<string, string> = {};
  for (const k of kundeRaw) {
    if (k.navn && k.monday_id) mondayIdMap[k.navn] = k.monday_id;
  }

  // Byg SOR-matchmap fra alle bosteder på tværs af pakker
  const alleBosteder = data.linjer.flatMap((l) =>
    l.bosteder.map((b) => ({ navn: b.navn, cvr: null }))
  );
  const sorMatchMap = sorEnheder.length > 0
    ? bygSorMatchMap(sorEnheder, alleBosteder)
    : undefined;

  return (
    <PakkerPage
      data={data}
      mondayIdMap={mondayIdMap}
      registreringer={registreringer}
      storPriser={storPriser}
      sorMatchMap={sorMatchMap}
    />
  );
}
