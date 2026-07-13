// src/features/nova/services/NovaBeskedService/novaBeskedService.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NovaBesked } from '@/features/nova/types/nova.types';

const FORNAVN = (navn: string) => navn.split(' ')[0] ?? navn;

// Fald tilbage til 3 dage siden hvis brugeren aldrig har logget ind
function defaultSidstSet(): string {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString();
}

function ugeStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

export async function beregnNovaBeskeder(
  brugerId: string,
  brugerNavn: string,
  sidstSet: string | null,
  supabase: SupabaseClient
): Promise<NovaBesked[]> {
  const siden = sidstSet ?? defaultSidstSet();
  const beskeder: NovaBesked[] = [];

  // 1. Nye tilsynsrapporter siden sidst login
  const { count: nyeRapporter } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .gte('scraper_dato', siden);

  if (nyeRapporter && nyeRapporter > 0) {
    beskeder.push({
      id: 'nye-rapporter',
      titel: `${nyeRapporter} ${nyeRapporter === 1 ? 'ny tilsynsrapport' : 'nye tilsynsrapporter'} siden sidst`,
      sub: `Nye bosteder at bearbejde — fundet siden ${new Date(siden).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}`,
      variant: 'advarsel',
      ikon: 'kalender',
    });
  }

  // 2. Kritiske fund siden sidst login
  const { count: kritiske } = await supabase
    .from('stps_rapporter')
    .select('id', { count: 'exact', head: true })
    .gte('scraper_dato', siden)
    .eq('fund_niveau', 'kritisk');

  if (kritiske && kritiske > 0) {
    beskeder.push({
      id: 'kritiske-fund',
      titel: `${kritiske} ${kritiske === 1 ? 'nyt kritisk fund' : 'nye kritiske fund'} registreret`,
      sub: 'Alvorlige fund — kræver hurtig opfølgning',
      variant: 'kritisk',
      ikon: 'advarsel',
    });
  }

  // 3. Egne kontakter denne uge — anerkendelse
  const { count: egneKontakter } = await supabase
    .from('bosted_kontakt_log')
    .select('id', { count: 'exact', head: true })
    .eq('bruger_id', brugerId)
    .eq('status', 'kontaktet')
    .gte('oprettet_at', ugeStart());

  if (egneKontakter && egneKontakter > 0) {
    beskeder.push({
      id: 'egne-kontakter',
      titel: `Du har kontaktet ${egneKontakter} ${egneKontakter === 1 ? 'bosted' : 'bosteder'} denne uge`,
      sub: `Godt arbejde, ${FORNAVN(brugerNavn)} — flot indsats`,
      variant: 'succes',
      ikon: 'stjerne',
    });
  }

  // 4. Seneste konvertering til Monday-kunde — fejring
  const { data: senestKobling } = await supabase
    .from('bosted_kontakt_log')
    .select('bosted_navn, oprettet_at')
    .eq('bruger_id', brugerId)
    .eq('status', 'kobling_oprettet')
    .gte('oprettet_at', ugeStart())
    .order('oprettet_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (senestKobling?.bosted_navn) {
    beskeder.push({
      id: 'kobling-succes',
      titel: `${senestKobling.bosted_navn} er nu konverteret til kunde`,
      sub: `Godt arbejde, ${FORNAVN(brugerNavn)}`,
      variant: 'succes',
      ikon: 'stjerne',
    });
  }

  return beskeder;
}
