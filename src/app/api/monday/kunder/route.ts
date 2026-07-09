import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { MondayKundeItem } from '@/features/monday/types/monday.types';
import type { MondayGruppe } from '@/features/monday/types/monday.types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('monday_kunder')
      .select('*')
      .order('oprettet_dato', { ascending: false, nullsLast: true });

    if (error) throw new Error(error.message);

    const kunder: MondayKundeItem[] = (data ?? []).map((r) => ({
      mondayId:         r.monday_id,
      navn:             r.navn ?? '',
      gruppe:           (r.gruppe ?? 'ukendt') as MondayGruppe,
      gruppeNavn:       r.gruppe_navn ?? '',
      adresse:          r.adresse,
      email:            r.email,
      website:          r.website,
      oprettetDato:     r.oprettet_dato,
      forløbsansvarlig: r.forloebsansvarlig,
      opfølgningsdato:  r.opfoelgningsdato,
      afsluttetDato:    r.afsluttet_dato,
      status:           r.status,
    }));

    return NextResponse.json({ ok: true, kunder });
  } catch (err) {
    const besked = err instanceof Error ? err.message : 'Ukendt fejl';
    return NextResponse.json({ ok: false, fejl: besked }, { status: 500 });
  }
}
