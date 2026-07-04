import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';
import type { CvrSignal } from '@/features/cvr/types/cvr.types';

type DbCvrSignal = {
  id: string;
  cvr: string;
  navn: string;
  kommune: string | null;
  adresse: string | null;
  branchekode: string;
  branchetekst: string;
  startdato: string | null;
  opdaget_dato: string;
  monday_item_id: string | null;
};

export async function hentCvrSignaler(): Promise<CvrSignal[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('cvr_signaler')
    .select('id, cvr, navn, kommune, adresse, branchekode, branchetekst, startdato, opdaget_dato, monday_item_id')
    .order('opdaget_dato', { ascending: false });

  if (error) {
    // Tabellen eksisterer muligvis ikke endnu — returner tom liste
    console.warn('[CvrSignalService] cvr_signaler ikke tilgængelig:', error.message);
    return [];
  }

  return (data as DbCvrSignal[]).map((r) => ({
    id:           r.id,
    cvr:          r.cvr,
    navn:         r.navn,
    kommune:      r.kommune,
    adresse:      r.adresse,
    branchekode:  r.branchekode,
    branchetekst: r.branchetekst,
    startdato:    r.startdato,
    opdagetDato:  r.opdaget_dato,
    mondayItemId: r.monday_item_id,
  }));
}
