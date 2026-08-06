// src/features/markedsdata/services/MarkedsdataService/markedsdataService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { MarkedsdataStats, MarkedsdataBosted, KommuneMarked, OpmærksomhedSignal } from '@/features/markedsdata/types/markedsdata.types';
import type { LosFilter, VisFilter, ParagrafFilter } from '@/lib/config/GlobalFilter';
import { KOMMUNALE_NØGLEORD, paragraf43InkluderOr, paragraf43EkskluderOr } from '@/lib/config/GlobalFilter';
import { erMarkedssignal } from '@/lib/business/MondayKundeRegler/mondayKundeRegler';
import type { DstKommuneRå } from '@/lib/api/DstClient';

type RåRapport = {
  id: string;
  stps_tilbud_navn: string;
  kommune: string | null;
  fund_niveau: string | null;
  rapport_dato: string | null;
  rapport_url: string | null;
  tp_tilbudstype: string | null;
  monday_item_id: string | null;
  monday_gruppe: string | null;
  los_medlem: boolean | null;
};

export async function hentMarkedsdataStats(
  dstData: DstKommuneRå[],
  losFilter: LosFilter = 'ekskluder',
  visFilter: VisFilter = 'alle',
  paragraf43Filter: ParagrafFilter = 'alle',
): Promise<MarkedsdataStats> {
  const supabase = getSupabaseServerClient();

  // Hent STPS-bosteder — filtrer LOS fra hvis ekskluder
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, kommune, fund_niveau, rapport_dato, rapport_url, tp_tilbudstype, monday_item_id, monday_gruppe, los_medlem')
    .order('rapport_dato', { ascending: false, nullsFirst: false });

  if (losFilter === 'ekskluder') {
    query = query.or('los_medlem.is.null,los_medlem.eq.false');
  }
  // §43 er som udgangspunkt IKKE relevant og vises ikke. Tændes filteret,
  // TILFØJES §43-bosteder oveni §107/§108 — men kun dem med en ægte
  // STPS-tilsynsrapport. §107/§108 påvirkes aldrig af dette filter.
  query = query.or(paragraf43Filter === 'inkluder_43' ? paragraf43InkluderOr() : paragraf43EkskluderOr());

  const { data } = await query;
  const rækker = (data ?? []) as RåRapport[];

  // Totalt marked = alle tilbud fra Tilbudsportalen (±LOS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tpQuery: any = supabase.from('tilbudsportalen_tilbud').select('*', { count: 'exact', head: true });
  if (visFilter === 'privat') {
    // Substring-match (ikke eksakt) — fanger alle Tilbudsportalens
    // stavevarianter af kommunal/regional/statslig driftsform.
    for (const ord of KOMMUNALE_NØGLEORD) {
      tpQuery = tpQuery.not('driftsform', 'ilike', `%${ord}%`);
    }
  }
  const [{ count: tpCount }, { count: losCount }] = await Promise.all([
    tpQuery,
    supabase.from('los_medlemmer').select('*', { count: 'exact', head: true }),
  ]);

  const losSubtrak = losFilter === 'ekskluder' ? (losCount ?? 0) : 0;
  const totalBosteder = (tpCount ?? rækker.length) - losSubtrak;
  const antalKunder = rækker.filter((r) => !erMarkedssignal(r.monday_item_id, r.monday_gruppe)).length;
  const antalKritiskeEllerStoerre = rækker.filter(
    (r) => r.fund_niveau === 'kritisk' || r.fund_niveau === 'stoerre',
  ).length;
  // "Aldrig kontaktet" = alle TP-tilbud minus dem vi har kontaktet (monday_item_id)
  const antalAldrigKontaktet = totalBosteder - antalKunder;

  // DST-borgere pr. kommune til opslag
  const dstMap = new Map<string, number>();
  for (const k of dstData) dstMap.set(k.kommune, k.total);

  // Kommuneaggregering
  const kommuneMap = new Map<string, KommuneMarked>();
  for (const r of rækker) {
    const k = r.kommune ?? 'Ukendt';
    if (!kommuneMap.has(k)) {
      kommuneMap.set(k, {
        kommune: k,
        antalBosteder: 0,
        antalKunder: 0,
        antalUrørt: 0,
        antalLos: 0,
        antalKritiske: 0,
        borgere: dstMap.get(k) ?? 0,
      });
    }
    const km = kommuneMap.get(k)!;
    km.antalBosteder++;
    if (!erMarkedssignal(r.monday_item_id, r.monday_gruppe)) km.antalKunder++;
    else km.antalUrørt++;
    if (r.los_medlem) km.antalLos++;
    if (r.fund_niveau === 'kritisk' || r.fund_niveau === 'stoerre') km.antalKritiske++;
  }

  const kommuner = [...kommuneMap.values()];
  const kommunerUdenKunder = kommuner.filter((k) => k.antalKunder === 0).length;

  const grænse60Dage = new Date();
  grænse60Dage.setDate(grænse60Dage.getDate() - 60);
  const opfølgning = rækker.filter(
    (r) => r.monday_item_id && r.rapport_dato && new Date(r.rapport_dato) < grænse60Dage,
  ).length;

  const opmærksomhedssignaler: OpmærksomhedSignal[] = [
    {
      type: 'nye_fund',
      label: 'Nye fund',
      beskrivelse: 'Bosteder med nye kritiske eller større fund',
      antal: antalKritiskeEllerStoerre,
    },
    {
      type: 'opfoelgning',
      label: 'Opfølgning mangler',
      beskrivelse: 'Ingen aktivitet i mere end 60 dage',
      antal: opfølgning,
    },
    {
      type: 'ingen_kunder',
      label: '0 kunder i kommunen',
      beskrivelse: 'Kommuner uden KeasCare som kunde',
      antal: kommunerUdenKunder,
    },
    {
      type: 'ikke_kontaktet',
      label: 'Ikke kontaktede bosteder',
      beskrivelse: 'Relevante bosteder uden kontakt',
      antal: antalAldrigKontaktet,
    },
  ];

  const bosteder: MarkedsdataBosted[] = rækker.map((r) => ({
    id: r.id,
    navn: r.stps_tilbud_navn,
    kommune: r.kommune,
    fundNiveau: r.fund_niveau,
    rapportDato: r.rapport_dato,
    erKunde: !erMarkedssignal(r.monday_item_id, r.monday_gruppe),
    losMedlem: r.los_medlem,
  }));

  return {
    totalBosteder,
    antalKunder,
    antalKritiskeEllerStoerre,
    antalAldrigKontaktet,
    kommunerMedData: kommuneMap.size,
    bosteder,
    kommuner,
    opmærksomhedssignaler,
  };
}
