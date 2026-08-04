// src/features/markedsdata/services/MarkedsdataService/markedsdataService.ts

import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { MarkedsdataStats, MarkedsdataBosted, KommuneMarked, OpmærksomhedSignal } from '@/features/markedsdata/types/markedsdata.types';
import type { DstKommuneRå } from '@/lib/api/DstClient';

type RåRapport = {
  id: string;
  stps_tilbud_navn: string;
  kommune: string | null;
  fund_niveau: string | null;
  rapport_dato: string | null;
  monday_item_id: string | null;
  los_medlem: boolean | null;
};

export async function hentMarkedsdataStats(dstData: DstKommuneRå[]): Promise<MarkedsdataStats> {
  const supabase = getSupabaseServerClient();

  // Hent STPS-bosteder (til tabel, fund, kundestatus m.m.)
  const { data } = await supabase
    .from('stps_rapporter')
    .select('id, stps_tilbud_navn, kommune, fund_niveau, rapport_dato, monday_item_id, los_medlem')
    .order('rapport_dato', { ascending: false, nullsFirst: false });

  const rækker = (data ?? []) as RåRapport[];

  // Totalt marked = alle tilbud fra Tilbudsportalen (samme tal som Dashboard)
  const { count: tpCount } = await supabase
    .from('tilbudsportalen_tilbud')
    .select('*', { count: 'exact', head: true });

  const totalBosteder = tpCount ?? rækker.length;
  const antalKunder = rækker.filter((r) => !!r.monday_item_id).length;
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
    if (r.monday_item_id) km.antalKunder++;
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
    erKunde: !!r.monday_item_id,
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
