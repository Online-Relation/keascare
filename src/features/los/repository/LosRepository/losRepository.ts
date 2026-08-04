// src/features/los/repository/LosRepository/losRepository.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { LosMedlem, LosListeItem } from '@/features/los/types/los.types';

export async function gemLosListeItems(items: LosListeItem[]): Promise<void> {
  if (items.length === 0) return;
  const supabase = getSupabaseServerClient();
  await supabase.from('los_medlemmer').upsert(
    items.map((i) => ({
      los_id: i.los_id,
      navn: i.navn,
      url: i.url,
      tilbudstyper: i.tilbudstyper,
    })),
    { onConflict: 'los_id', ignoreDuplicates: false },
  );
}

export async function gemLosMedlem(m: LosMedlem): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.from('los_medlemmer').upsert(
    { ...m },
    { onConflict: 'los_id', ignoreDuplicates: false },
  );
}

export async function hentUbehandledeLosItems(max = 200): Promise<LosListeItem[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('los_medlemmer')
    .select('los_id, navn, url, tilbudstyper')
    .is('scraper_dato', null)
    .limit(max);
  return (data ?? []) as LosListeItem[];
}

export async function matchLosTilBosted(): Promise<number> {
  const supabase = getSupabaseServerClient();

  // Sæt alle til false først — så "Ikke tjekket" forsvinder efter første match-kørsel
  await supabase.from('stps_rapporter').update({ los_medlem: false }).neq('id', '');

  // Hent alle LOS-medlemmer med CVR
  const { data: losData } = await supabase
    .from('los_medlemmer')
    .select('cvr')
    .not('cvr', 'is', null);

  if (!losData || losData.length === 0) return 0;

  const cvrListe = losData.map((r: { cvr: string }) => r.cvr);

  const { data: opdateret } = await supabase
    .from('stps_rapporter')
    .update({ los_medlem: true })
    .in('cvr', cvrListe)
    .select('id');

  return opdateret?.length ?? 0;
}

export async function nulstilLosMedlem(): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.from('stps_rapporter').update({ los_medlem: false }).neq('id', '');
}
